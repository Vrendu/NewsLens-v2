
# **NewsLens**

NewsLens is a Chrome extension that provides users with insightful information about the political bias of news articles they are reading and suggests related articles based on the content. It helps users navigate media bias and identify diverse perspectives, promoting a more balanced view of current events.

## **Features**

**Political Bias Analysis:** Automatically identifies the political bias of the active article's publicator using data from the Media Bias Fact Check API.

**Related Articles Suggestion:** Recommends articles discussing the same or similar topic, coming from publications across the political bias spectrum. Using NewsCatcher API (https://www.newscatcherapi.com/).

**Bias Visualization:** Presents the bias data in a clean, user-friendly UI with a color-coded bias indicator (e.g., Left, Right, Center, etc). Related articles will be marked with the bias and other metrics.


<img width="1192" alt="Screenshot 2024-11-20 at 3 33 34 PM" src="https://github.com/user-attachments/assets/1f9ea9e4-2359-48d8-8c71-0cb1509cc00b">

<img width="1223" alt="Screenshot 2024-11-20 at 3 33 54 PM" src="https://github.com/user-attachments/assets/11f8c867-0196-4502-a6c9-88b74fd8f9d4">

<img width="1191" alt="Screenshot 2024-11-20 at 3 35 24 PM" src="https://github.com/user-attachments/assets/48feba4a-439d-47c2-8fa8-cd3f1feaa0d6">

<img width="1333" alt="Screenshot 2024-11-20 at 3 38 33 PM" src="https://github.com/user-attachments/assets/89b967f7-a2f5-4476-982b-db8a47effcd8">

<img width="1469" alt="Screenshot 2024-11-20 at 3 38 44 PM" src="https://github.com/user-attachments/assets/f8b25b90-b048-4cf9-bf3a-2eb225cec86c">




To try for yourself:

in the terminal, cd into extension_frontend and run "npm install" 
after any changes to code in this folder, use command "npm run build" 

Go to chrome://extensions/ in your browser, and toggle to Developer Mode 
Click Load Unpacked, and select the "dist" folder within extension_frontend

in another terminal, cd into backend and create virtual environment with:
python -m venv venv

and start virtual environment with command: source venv/bin/activate

install dependencies with pip install -r requirements.txt

start server with command: uvicorn main:app --reload





