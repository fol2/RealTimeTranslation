# Real-Time Speech Translator

A modern web application for real-time speech translation using Azure Cognitive Services. This project is a migration from a Python GUI application to a full-stack TypeScript web application.

## Features

- Real-time speech recognition and translation
- Support for multiple languages
- Bilingual output capability
- Dark/light theme support
- Responsive web interface
- Type-safe implementation

## Tech Stack

### Frontend
- React with TypeScript
- Socket.io client for real-time communication
- Vite for build tooling
- CSS for styling

### Backend
- Node.js with TypeScript
- Express.js server
- Socket.io for WebSocket communication
- Azure Cognitive Services Speech SDK

## Prerequisites

1. Node.js (v14 or higher)
2. Azure Cognitive Services Speech account
3. npm or yarn package manager

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd RealTimeTranslation
   ```

2. Install dependencies:
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env` in the server directory
   - Add your Azure Speech Service credentials:
     ```
     SPEECH_KEY=your_azure_speech_key
     SPEECH_REGION=your_azure_region
     PORT=3001 (optional)
     ```

## Development

1. Start the server:
   ```bash
   cd server
   npm run dev
   ```

2. Start the client:
   ```bash
   cd client
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser

## Project Structure

```
RealTimeTranslation/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── types.ts       # TypeScript type definitions
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
│   ├── public/            # Static assets
│   └── package.json       # Frontend dependencies
│
├── server/                # Backend Node.js server
│   ├── src/
│   │   └── index.ts      # Server implementation
│   ├── .env.example      # Environment variables template
│   └── package.json      # Backend dependencies
│
└── README.md             # Project documentation
```

## Key Improvements

1. **Type Safety**
   - Full TypeScript implementation
   - Proper type definitions for all components
   - Type-safe Socket.io events

2. **Code Organization**
   - SOLID principles implementation
   - Clear separation of concerns
   - Modular component structure

3. **Performance**
   - Efficient state management
   - Memory usage optimization
   - Real-time updates optimization

4. **Error Handling**
   - Comprehensive error catching
   - User-friendly error messages
   - Automatic error cleanup

5. **Security**
   - Environment variable validation
   - CORS configuration
   - API key protection

## Available Languages

- English (US)
- Cantonese
- Chinese (Simplified)
- Chinese (Traditional)
- Japanese
- Korean

More languages can be added by updating the language options in the Settings component.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original Python GUI implementation
- Azure Cognitive Services team
- React and TypeScript communities
