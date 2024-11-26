
# **NewsLens**

NewsLens is a Chrome extension that provides users with insightful information about the political bias of news articles they are reading and suggests related articles based on the content. It helps users navigate media bias and identify diverse perspectives, promoting a more balanced view of current events.

## **Features**

**Political Bias Analysis:** Automatically identifies the political bias of the active article's publicator using data from the Media Bias Fact Check API.

**Related Articles Suggestion:** Recommends articles discussing the same or similar topic, coming from publications across the political bias spectrum. Using NewsCatcher API (https://www.newscatcherapi.com/).

**Bias Visualization:** Presents the bias data in a clean, user-friendly UI with a color-coded bias indicator (e.g., Left, Right, Center, etc). Related articles will be marked with the bias and other metrics.


<img width="1310" alt="Screenshot 2024-11-25 at 6 42 09 PM" src="https://github.com/user-attachments/assets/9adcba12-d0ce-44fc-ae23-c66f71326d4b">
<img width="1314" alt="Screenshot 2024-11-25 at 6 42 24 PM" src="https://github.com/user-attachments/assets/98e95944-fca5-4754-92eb-e478386b390f">
<img width="1312" alt="Screenshot 2024-11-25 at 6 43 20 PM" src="https://github.com/user-attachments/assets/aca9f9cf-61f4-4acf-bd97-d6303c28c2e2">
<img width="1319" alt="Screenshot 2024-11-25 at 6 43 26 PM" src="https://github.com/user-attachments/assets/5e002f18-b83b-4aa1-a60f-e2bb14ff83f1">
<img width="1329" alt="Screenshot 2024-11-25 at 6 43 54 PM" src="https://github.com/user-attachments/assets/cc64658a-7fec-45cd-adbe-3073cd7ee3ef">




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





