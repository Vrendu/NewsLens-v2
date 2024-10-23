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


# Helper function for Newscatcher
def call_newscatcher(keywords: list, query_domains: list, exclude_domain: str) -> dict:

    processed_keyword = []
    for keyword in keywords:
        keyword = keyword.replace(" ", " AND ")
        keyword = f"({keyword})" 
        processed_keyword.append(keyword)
    query = ' OR '.join(processed_keyword)  # Use the extracted keywords for the query (instead of keywords)

    print("query", query)
    print("query_domains", query_domains)
    query_params = {
        "q": query,  # Use the extracted keywords for the query
        "sources": ",".join(query_domains or []),
        "not_sources": exclude_domain,
        "sort_by": "relevancy",
        "lang": "en",
        
    }

    encoded_params = urlencode(query_params)
    api_url = f"https://api.newscatcherapi.com/v2/search?{encoded_params}"
    headers = {"X-Api-Key": NEWSCATCHER_API_KEY}

    response = requests.get(api_url, headers=headers)
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to fetch related articles: {response.text}",
        )

    articles = response.json().get("articles", [])

    # Filter and return only the required fields
    filtered_articles = [
        {
            "clean_url": article.get("clean_url", ""),
            "excerpt": article.get("excerpt", ""),
            "link": article.get("link", ""),
            "summary": article.get("summary", ""),
            "title": article.get("title", ""),
            "media": article.get("media", ""),
        }
        for article in articles
    ]

    return filtered_articles


# Route to get related articles
@app.post("/related_articles_by_text")
async def get_related_articles_by_text(request: TitleAndTextRequest):
    exclude_domain = request.domain.replace("www.", "") 
    combined_text = f"{request.title} "
    keywords = extract_keywords_from_text(combined_text)

    all_domains = [
        "cnn.com",
        "foxnews.com",
        "nypost.com",
        "washingtonpost.com",
        "latimes.com",
        "bloomberg.com",
        "cbsnews.com",
        "npr.org",
        "aljazeera.com",
        "bbc.com",
        "cbsnews.com",
        "nytimes.com",
        "breitbart.com",
        "msnbc.com",
    ]
    query_domains = all_domains.remove(exclude_domain) or all_domains
    
    articles = call_newscatcher(keywords, query_domains, exclude_domain)

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


@app.on_event("shutdown")
async def shutdown():
    conn = psycopg2.connect(os.getenv("DATABASE_URL"))
    conn.close()
