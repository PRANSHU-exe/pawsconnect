# PawsConnect 🐾

A community-driven platform for pet lovers to connect, share experiences, and get expert advice for their furry friends.

## Features

- 🔐 **Authentication**: Sign up/in with email, Google, or Apple
- 👥 **Community Forum**: Ask questions, share experiences, and get answers
- 🏷️ **Categories**: Health & Wellness, Behavior, Nutrition, Grooming, Training
- 👤 **User Profiles**: Create personal and pet profiles
- 💬 **PawsBot AI**: AI-powered chatbot for instant pet care advice
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 📱 **Responsive Design**: Works seamlessly on all devices
- 💖 **Social Features**: Like, comment, share, and follow other pet lovers

## Tech Stack

### Frontend
- React.js
- React Router
- Axios
- CSS3 with responsive design
- Context API for state management

### Backend
- Node.js
- Express.js
- MongoDB Atlas
- JWT Authentication
- Passport.js (Google/Apple OAuth)
- Multer (File uploads)
- Gemini AI API

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Google Cloud Console project (for OAuth)
- Apple Developer account (for Apple Sign-In)

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd pawsconnect
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file with the following variables:
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_client_id
APPLE_CLIENT_SECRET=your_apple_client_secret
GEMINI_API_KEY=AIzaSyAJ3_SQFane-vQgzT2KNsjfobcDQm1i8_4
PORT=5000

# Start the backend server
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. MongoDB Atlas Setup
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Create a database user
5. Add your IP address to the whitelist
6. Get the connection string and add it to your .env file

### 5. Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Add client ID and secret to .env file

## Deployment

### Vercel Deployment (Frontend)
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Deploy the frontend from the `frontend` folder

### Render Deployment (Backend)
1. Create a new Web Service on Render
2. Connect your GitHub repo
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add all environment variables

## Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_random_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
APPLE_CLIENT_ID=your_apple_service_id
APPLE_TEAM_ID=your_apple_team_id
APPLE_KEY_ID=your_apple_key_id
APPLE_PRIVATE_KEY=your_apple_private_key
GEMINI_API_KEY=AIzaSyAJ3_SQFane-vQgzT2KNsjfobcDQm1i8_4
PORT=5000
NODE_ENV=production
```

## Project Structure
```
pawsconnect/
├── backend/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── uploads/
│   ├── .env
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   ├── package.json
│   └── README.md
└── README.md
```

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License
This project is licensed under the MIT License.