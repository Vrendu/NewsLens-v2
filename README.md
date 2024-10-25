
# **NewsLens**

NewsLens is a Chrome extension that provides users with insightful information about the political bias of news articles they are reading and suggests related articles based on the content. It helps users navigate media bias and identify diverse perspectives, promoting a more balanced view of current events.

## **Features**

**Political Bias Analysis:** Automatically identifies the political bias of the active article's publicator using data from the Media Bias Fact Check API.

**Related Articles Suggestion:** Recommends articles discussing the same or similar topic, coming from publications across the political bias spectrum. Using NewsCatcher API (https://www.newscatcherapi.com/).

**Bias Visualization:** Presents the bias data in a clean, user-friendly UI with a color-coded bias indicator (e.g., Left, Right, Center, etc). Related articles will be marked with the bias and other metrics.

Note: the below images reflect current progress so far, not final output

<img width="1191" alt="Screenshot 2024-10-24 at 7 07 42 PM" src="https://github.com/user-attachments/assets/449a5f8a-5673-4ecd-9a09-6461a84c8f68">


<img width="1422" alt="Screenshot 2024-10-24 at 7 06 40 PM" src="https://github.com/user-attachments/assets/a7bcde85-2810-4867-b916-78f1bc67af17">




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





