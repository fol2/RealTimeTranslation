# Real-Time Speech Translator

A full-stack web application for real-time speech translation using Azure Cognitive Services. This application supports multiple languages and provides a modern, responsive interface with both light and dark themes.

## Features

- Real-time speech recognition and translation
- Support for multiple target languages
- Dark/Light theme toggle
- Persistent settings using localStorage
- Real-time updates using Socket.io
- Modern, responsive UI

## Prerequisites

- Node.js (v14 or later)
- npm (v6 or later)
- Azure Speech Service subscription
  - Speech service key
  - Region identifier

## Project Structure

```
RealTimeTranslation/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── App.jsx      # Main application
│   │   └── App.css      # Styles
│   └── package.json
├── server/              # Node.js backend
│   ├── index.js         # Server implementation
│   └── package.json
└── README.md
```

## Setup

1. Clone the repository and switch to the feature branch:
   ```bash
   git checkout feature/react-node-web-version
   ```

2. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update with your Azure Speech Service credentials:
     ```
     SPEECH_KEY=your_azure_speech_key_here
     SPEECH_REGION=your_azure_region_here
     ```

4. Install frontend dependencies:
   ```bash
   cd ../client
   npm install
   ```

## Running the Application

1. Start the backend server:
   ```bash
   cd server
   node index.js
   ```
   The server will run on http://localhost:3001

2. In a new terminal, start the frontend:
   ```bash
   cd client
   npm run dev
   ```
   The frontend will be available at http://localhost:5173

## Usage

1. Open the application in your browser
2. Configure your preferred:
   - Input language
   - Primary output language
   - Secondary output language (optional)
   - Theme (light/dark)
3. Click "Start Recording" to begin translation
4. Speak into your microphone
5. View real-time transcription and translation results
6. Click "Stop" when finished

## Development

- Frontend code is in the `client` directory
- Backend code is in the `server` directory
- Both use modern ES6+ JavaScript/React
- Real-time communication is handled via Socket.io
- Styling uses CSS variables for theming

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Submit a pull request

## License

MIT License
