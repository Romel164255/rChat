
rChat – Real-Time Chat Application

rChat is a full-stack real-time messaging web application that allows users to communicate instantly.
The system uses WebSockets through Socket.IO to establish real-time communication between the client and server.

Users can authenticate securely, send messages instantly, and retrieve chat history stored in a PostgreSQL database.

This project demonstrates event-driven architecture, WebSocket communication, authentication integration, and backend API development.

Live Demo

Frontend
https://chatty-phi-ten.vercel.app

Repository
https://github.com/Romel164255/rChat

Features
User Features

Real-time messaging

Secure user authentication

Persistent chat history

Multi-user chat system

Instant message delivery using WebSockets

System Features

WebSocket communication using Socket.IO

RESTful backend APIs

Authentication middleware

PostgreSQL database storage

Event-driven backend architecture

Tech Stack
Frontend

HTML

CSS

JavaScript

React (if used in your repo)

Backend

Node.js

Express.js

Socket.IO

Database

PostgreSQL

Authentication

Firebase Authentication

Tools

Git

GitHub

Vercel (deployment)

Project Structure
rChat
│
├── backend
│   ├── controllers
│   ├── routes
│   ├── middleware
│   ├── sockets
│   └── server.js
│
├── frontend
│   ├── src
│   ├── components
│   ├── pages
│   └── App.js
│
└── README.md
Installation
1 Clone the repository
git clone https://github.com/Romel164255/rChat.git
cd rChat
2 Install dependencies

Backend

cd backend
npm install

Frontend

cd frontend
npm install
3 Environment Variables

Create a .env file inside the backend folder.

Example:

PORT=5000
DATABASE_URL=your_postgresql_connection
FIREBASE_API_KEY=your_firebase_key
Run the Application

Start backend server

cd backend
npm start

Start frontend

cd frontend
npm start

Application runs at

http://localhost:3000
API Endpoints
Authentication
Verify User Token
POST /api/auth/verify

Verifies Firebase authentication token.

Users
Get Current User
GET /api/users/me

Returns information about the authenticated user.

Messages
Send Message
POST /api/messages

Request body

{
  "message": "Hello",
  "receiverId": "123"
}
Get Chat History
GET /api/messages/:chatId

Returns message history between users.

Get All Conversations
GET /api/chats

Returns all chats of the logged-in user.

Socket.IO Events

Real-time communication is handled through Socket.IO.

Client → Server

Join chat room

join_room

Send message

send_message

User typing

typing
Server → Client

Receive message

receive_message

User joined

user_joined

User typing notification

user_typing
Example WebSocket Flow

User connects to the server.

Client joins a chat room.

User sends a message.

Server stores message in database.

Server broadcasts message to all users in the room.

Future Improvements

Group chat support

Message read receipts

Image and file sharing

Online/offline user status

Push notifications

Author

Romel Augustine Fernandez

GitHub
https://github.com/Romel164255

LinkedIn
https://linkedin.com/in/romel-augustine-fernandez-775a643aa
