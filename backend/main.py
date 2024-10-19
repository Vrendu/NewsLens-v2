from fastapi import FastAPI, BackgroundTasks, HTTPException
from pydantic import BaseModel
from mbfc import update_mbfc_data, check_bias_data
import psycopg2
import os
import requests
from dotenv import load_dotenv
from urllib.parse import urlencode
from keybert import KeyBERT

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI()

# Retrieve API Key from environment variables
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
NEWSCATCHER_API_KEY = os.getenv("NEWSCATCHER_API_KEY")
MEDIASTACK_API_KEY = os.getenv("MEDIASTACK_API_KEY")

# Initialize KeyBERT model
kw_model = KeyBERT()  # Keep it local, no need to load at runtime


# Define Pydantic models for requests
class DomainRequest(BaseModel):
    domain: str


class TitleAndTextRequest(BaseModel):
    title: str
    innerText: str
    domain: str


# Simplified function to extract keywords using KeyBERT
def extract_keywords_from_text(text: str, max_keywords=3):
    # Extract keywords with KeyBERT
    keywords = kw_model.extract_keywords(
        text, keyphrase_ngram_range=(1, 2), stop_words="english", top_n=max_keywords
    )
    return [kw[0] for kw in keywords]


# Helper function for NewsAPI
def call_newsapi(query: str, domain: str) -> dict:
    # Define the query parameters for NewsAPI
    query_params = {
        "q": query,  # Use the extracted keywords for the query
        "excludeDomains": domain.replace("www.", ""),
        "language": "en",
        "sortBy": "relevancy",
    }

    # Encode the query parameters to ensure proper URL formatting
    encoded_params = urlencode(query_params)

    # Construct the full URL for the API request to NewsAPI
    api_url = f"https://newsapi.org/v2/everything?{encoded_params}"

    # Headers for the API request to NEWS API
    headers = {"X-Api-Key": NEWS_API_KEY}

    # Make the request to NewsAPI
    response = requests.get(api_url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to fetch related articles: {response.text}",
        )

    # Parse the articles from the response
    return response.json()


def call_mediastack(query: str, domain: str) -> dict:

    # Define the query parameters for Mediastack
    query_params = {
        "access_key": MEDIASTACK_API_KEY,
        "keywords": query,
    }

    # Encode the query parameters
    encoded_params = urlencode(query_params)
    print("encoded_params", encoded_params)  # Debugging to see the encoded params

    # Construct the API URL
    api_url = f"http://api.mediastack.com/v1/news?{encoded_params}"

    try:
        # Make the request to Mediastack
        response = requests.get(api_url)
        print(f"Response status code: {response.status_code}")  # Debugging

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch related articles: {response.text}",
            )

        # Parse and return the articles from the response
        data = response.json()
        print(f"Response data: {data}")  # Debugging to see the response content
        return data

    except Exception as e:
        print(f"Error occurred: {e}")
        raise HTTPException(
            status_code=500, detail=f"Error fetching related articles: {str(e)}"
        )


# Route to get related articles
@app.post("/related_articles_by_text")
async def get_related_articles_by_text(request: TitleAndTextRequest):
    # Extract keywords using KeyBERT from both title and inner text
    combined_text = f"{request.title} "
    keywords = extract_keywords_from_text(combined_text)
    query = " OR ".join(keywords)  # Use OR for basic relevance
    #query = ",".join(keywords)

    print(query)
    # Call NewsAPI (default, active)
    articles = call_newsapi(query, request.domain)

    return {"data": articles}


# Route to trigger MBFC data update
@app.post("/update_mbfc_data")
async def update_mbfc_data_route(background_tasks: BackgroundTasks):
    background_tasks.add_task(update_mbfc_data)
    return {"message": "MBFC data update has been triggered in the background."}


# Route to check bias data based on the domain
@app.post("/check_bias_data")
async def check_bias_data_route(request: DomainRequest):
    return check_bias_data(request.domain)


# Function to set up necessary tables for GDELT and MBFC
def setup_database():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS mbfc_data (
            id SERIAL PRIMARY KEY,
            name TEXT,
            mbfc_url TEXT,
            domain TEXT,
            bias TEXT,
            factual_reporting TEXT,
            country TEXT,
            credibility TEXT
        )
        """
    )

    conn.commit()
    cursor.close()
    conn.close()


# FastAPI startup event to ensure necessary tables are created
@app.on_event("startup")
async def startup():
    setup_database()
