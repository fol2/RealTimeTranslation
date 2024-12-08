# Real-Time Speech Translator

A modern web application for real-time speech translation using Azure Cognitive Services. This application combines a React frontend with a Python backend to provide seamless real-time speech translation capabilities.

## Features

- Real-time speech recognition and translation
- Support for multiple languages including English, Cantonese, Chinese (Simplified/Traditional), Japanese, and Korean
- Bilingual output capability
- Modern, responsive web interface with dark/light theme support
- Semi-transparent, always-on-top window mode
- Type-safe frontend implementation

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Framer Motion for animations
- Microsoft Cognitive Services Speech SDK
- Heroicons for UI icons

### Backend
- Python
- Azure Cognitive Services Speech SDK
- tkinter for legacy GUI support
- python-dotenv for environment management

## Prerequisites

1. Python 3.x
2. Node.js (v18 or higher recommended)
3. Azure Cognitive Services Speech account
4. npm or yarn package manager

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd RealTimeTranslation
   ```

2. Set up the Python environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env` in the root directory
   - Add your Azure Speech Service credentials:
     ```
     SPEECH_KEY=your_azure_speech_key
     SPEECH_REGION=your_azure_region
     ```

## Development

1. Start the Python backend:
   ```bash
   python translator_app.py
   ```

2. Start the frontend development server:
   ```bash
   cd client
   npm run dev
   ```

3. Open `http://localhost:38220` in your browser

## Project Structure

```
RealTimeTranslation/
├── client/                 # Frontend React application
│   ├── src/               # Source code
│   ├── public/            # Static assets
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite configuration
│
├── .venv/                 # Python virtual environment
├── translator_app.py      # Python backend implementation
├── requirements.txt       # Python dependencies
├── settings.json          # Application settings
└── README.md             # Project documentation
```

## Key Features

1. **Speech Recognition**
   - Real-time speech capture and recognition
   - Support for multiple input languages
   - Configurable speech recognition settings

2. **Translation**
   - Simultaneous translation to multiple languages
   - Support for bilingual output
   - High-accuracy Azure-powered translation

3. **User Interface**
   - Modern, responsive design
   - Dark/light theme support
   - Semi-transparent window mode
   - Always-on-top functionality

4. **Performance**
   - Efficient real-time processing
   - Optimized memory usage
   - Smooth user experience

## Available Languages

The application supports translation between multiple languages, including:
- English (US)
- Cantonese
- Chinese (Simplified)
- Chinese (Traditional)
- Japanese
- Korean

Additional languages can be configured through the settings interface.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Azure Cognitive Services team
- React and TypeScript communities
- Python community
