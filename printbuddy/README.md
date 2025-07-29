Print$buddy
A late-night printing service for MNIT Jaipur students, offering B&W (₹4), Color (₹14), and delivery for girls (₹25 extra). Founded by Prakash (MNIT CSE 4th Year), Manish Meena (MNIT CSE 4th Year), and co-founder Tanik Saini (MNIT Meta 4th Year).
Project Structure

client/: React + TypeScript front-end
server/: Node.js + Express back-end

Setup Instructions
Prerequisites

Node.js (v16 or higher)
MongoDB Atlas account
Visual Studio Code

Front-end Setup

Navigate to client/:cd client


Install dependencies:npm install


Run the front-end:npm start



Back-end Setup

Navigate to server/:cd server


Install dependencies:npm install


Create a .env file in server/ with:MONGODB_URI=your_mongodb_uri


Install dotenv:npm install dotenv


Add to server.js:require('dotenv').config();


Run the back-end:node server.js



Running the Project

Start the back-end (node server.js in server/).
Start the front-end (npm start in client/).
Open http://localhost:3000 in your browser.
Place an order or submit feedback to test functionality.
Check MongoDB for stored orders and feedback.

Notes

Get MONGODB_URI from MongoDB Atlas (https://www.mongodb.com/cloud/atlas).
Orders are stored in MongoDB; confirm manually via WhatsApp (+919251028070) or phone.
Use a Google Sheet to track orders for manual confirmations.
