# Spotify Playlist App — CS50x 2025 Final Project

#### Live server: https://spotifyappclient.vercel.app

## Description

A full-stack web application that integrates with the Spotify Web API. Users can create an account, log in, browse playlists and their details, save favorites, and customize the interface (light/dark theme). The project is split into a **React** single-page client and a **Node.js / Express** REST API backed by **MongoDB**.

## Motivation

I built this app to learn the core principles of programming by working on something I'm genuinely interested in: music. Instead of following a purely abstract exercise, I wanted a project where every new concept had a concrete purpose. Working with Spotify data gave me a reason to learn how a client talks to a server, how users are authenticated, how data is stored in a database, and how to keep secrets out of the browser.

Along the way the project became a practical way to connect what CS50x teaches in theory (data, algorithms, web, security) with a complete, working full-stack application.

## Features

- User registration and login (passwords hashed with bcrypt, sessions via JWT stored in cookies)
- Input validation on the server (express-validator)
- Fetching Spotify data through the backend (the server talks to the Spotify API, so API secrets never reach the browser)
- Playlist details view
- Favorites saved per user in the database
- User details and settings views, including theme switching
- Server deployed on Vercel

## Tech Stack

| Layer    | Technologies |
| -------- | ------------ |
| Client   | React 19, Vite 7, axios, react-login-page, ESLint |
| Server   | Node.js, Express 5, Mongoose (MongoDB), jsonwebtoken, bcrypt, cookie-parser, cors, express-validator, dotenv |
| Hosting  | Vercel (server) |

## Project Structure

```
finalProjectCS50x2025/
├── client/                  # React front end (Vite)
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   ├── .env.production      # production API URL for the client
│   ├── public/
│   └── src/
│       ├── main.jsx         # React entry point
│       ├── App.jsx          # Root component, top-level view logic
│       ├── ThemeContext.jsx # Context providing the light/dark theme
│       ├── App.css, index.css
│       └── components/
│           ├── LoginForm.jsx
│           ├── RegisterForm.jsx
│           ├── PlaylistDetails.jsx
│           ├── UserDetails.jsx
│           └── SettingsView.jsx
└── server/                  # Express REST API
    ├── index.js             # App entry point: middleware setup, routes, server start
    ├── database.js          # MongoDB connection (Mongoose)
    ├── checkUsers.js        # Helper script for inspecting users in the database
    ├── vercel.json          # Vercel deployment configuration
    ├── middleware/
    │   └── auth.js          # Verifies the JWT and protects private routes
    ├── models/
    │   ├── User.js          # User schema
    │   └── Favorite.js      # Favorite schema (linked to a user)
    └── routes/
        ├── auth.js          # Register / login / logout endpoints
        ├── favorites.js     # Add, list and remove favorites
        └── spotify.js       # Proxy endpoints to the Spotify API
```

### What each part does

- **`server/index.js`** – creates the Express app, enables CORS, JSON parsing and cookie parsing, mounts the `auth`, `favorites` and `spotify` routers and connects to the database.
- **`server/database.js`** – opens the MongoDB connection using the connection string from environment variables.
- **`server/middleware/auth.js`** – reads the JWT from the request, verifies it and attaches the user to the request; routes that need a logged-in user go through it.
- **`server/models/`** – Mongoose schemas for users and their favorites.
- **`server/routes/`** – the API endpoints, grouped by responsibility (authentication, favorites, Spotify data).
- **`client/src/components/`** – one component per screen/feature: login, registration, playlist details, user details and settings.
- **`client/src/ThemeContext.jsx`** – React Context that stores the current theme and shares it with all components.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A MongoDB database (local or MongoDB Atlas)
- Spotify API credentials from the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)

### 1. Clone the repository

```bash
git clone https://github.com/Dorian2115/finalProjectCS50x2025.git
cd finalProjectCS50x2025
```

### 2. Run the server

```bash
cd server
npm install
```

Create a `server/.env` file:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
CLIENT_ID=your_spotify_client_id
CLIENT_SECRET=your_spotify_client_secret
REDIRECT_URI=http://localhost:3001/api/spotify/callback
CLIENT_URL=http://localhost:5173
PORT=3001
```

Add `http://localhost:3001/api/spotify/callback` as a Redirect URI in your Spotify app settings.
Do not commit the `.env` file or share its secrets.

Start it:

```bash
npm run live   
# or
npm start      
```

### 3. Run the client

```bash
cd client
npm install
npm run dev
```

Vite will print the local address (usually http://localhost:5173). During development, the client defaults to the local API at `http://localhost:3001`.
The production API URL is configured in `client/.env.production` and is used for production builds. To override the API URL locally, create `client/.env.development.local` with:

```env
API_URL=http://localhost:3001
```

### Other scripts (client)

```bash
npm run build     
npm run preview   
npm run lint      
```

## Design Decisions

- **Separate client and server** – keeps the Spotify credentials and database access on the backend and lets the front end and API be deployed independently.
- **JWT in cookies + bcrypt** 
- **MongoDB with Mongoose** 
- **Spotify calls through the server** 
- **React Context for theming** 
- **Vite** – fast dev server and simple build setup.
- **Vercel** 

## Challenges and Possible Improvements

- Add automated tests (the server currently has no test script)

## Author

Dominik — [@Dorian2115](https://github.com/Dorian2115)

Readme was generated with the use of AI
