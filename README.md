
# **NewsLens**

NewsLens is a Chrome extension that provides users with insightful information about the political bias of news articles they are reading and suggests related articles based on the content. It helps users navigate media bias and identify diverse perspectives, promoting a more balanced view of current events.

## **Features**

**Political Bias Analysis:** Automatically identifies the political bias of the active article's publicator using data from the Media Bias Fact Check API.

**Related Articles Suggestion:** Recommends articles discussing the same or similar topic, coming from publications across the political bias spectrum. Using NewsCatcher API (https://www.newscatcherapi.com/).

**Bias Visualization:** Presents the bias data in a clean, user-friendly UI with a color-coded bias indicator (e.g., Left, Right, Center, etc). Related articles will be marked with the bias and other metrics.

<img width="1336" alt="Screenshot 2024-11-25 at 4 16 56 PM" src="https://github.com/user-attachments/assets/ff6247d2-b405-4abd-93eb-77bdd11f31fa">
<img width="1325" alt="Screenshot 2024-11-25 at 4 17 21 PM" src="https://github.com/user-attachments/assets/eae923bc-6c63-4f66-aa4d-e5623925221a">
<img width="1308" alt="Screenshot 2024-11-25 at 4 18 09 PM" src="https://github.com/user-attachments/assets/bdc71636-b1fc-4e60-a2a1-690c3edeee18">
<img width="1311" alt="Screenshot 2024-11-25 at 4 18 38 PM" src="https://github.com/user-attachments/assets/14475b9a-3939-4232-8295-8380170d04c4">
<img width="1319" alt="Screenshot 2024-11-25 at 4 18 59 PM" src="https://github.com/user-attachments/assets/4afecf2c-63e7-49f6-8c18-257a1a6e3ab8">




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





