# Real-Time Speech Translator

A real-time speech translation application built with Python and Azure Cognitive Services. This application provides instant speech-to-text translation with support for multiple languages, making it perfect for real-time translation of system audio or microphone input.

## Features

- Real-time speech recognition and translation
- Support for multiple input and output languages
- A GUI that stays on top of other windows
- Settings persistence across sessions
- System audio capture support through BlackHole (macOS) or Virtual Audio Cable (Windows)
- Flexible audio input selection

## Prerequisites

- Python 3.11 or higher
- Azure Cognitive Services Speech API key (set in `.env` file)
- Virtual environment (recommended)
- For system audio capture:
  - macOS: BlackHole 2ch
  - Windows: Virtual Audio Cable
  - Linux: PulseAudio virtual device

## Installation

1. Clone the repository:
```bash
git clone https://github.com/fol2/RealTimeTranslation.git
cd RealTimeTranslation
```

2. Create and activate a virtual environment (recommended):
```bash
# macOS/Linux
python3.11 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt

# For macOS, if you encounter issues with PyAudio:
brew install portaudio
pip install pyaudio

# For Windows, if you encounter issues with PyAudio:
pip install pipwin
pipwin install pyaudio
```

4. Create a `.env` file in the project root and add your Azure Speech API credentials:
```
SPEECH_KEY=your_azure_speech_key
SPEECH_REGION=your_azure_region
```

## Setting up System Audio Capture

### macOS (using BlackHole 2ch)
1. Install BlackHole 2ch:
```bash
brew install blackhole-2ch
```

2. Configure System Audio:
   - Open System Settings > Sound
   - Under Input, select "BlackHole 2ch"
   - The application will use this as its audio input source
   - Your system's audio output should remain set to your speakers/headphones

3. Route Application Audio to BlackHole:
   - For specific applications: In the application's audio settings, set the input to "BlackHole 2ch"
   - For all system audio: Create a Multi-Input Device in Audio MIDI Setup
     - Open Audio MIDI Setup (use Spotlight to find it)
     - Click the "+" button in the bottom left
     - Select "Create Aggregate Device"
     - Check both your regular input device and "BlackHole 2ch"
     - Set your regular input device as the clock source

### Windows (using Virtual Audio Cable)
1. Download and install Virtual Audio Cable (VAC)
2. Set VAC as the output for applications you want to translate
3. In Windows Sound Settings, set VAC as your default recording device

### Linux (using PulseAudio)
1. Load the module-loopback:
```bash
pactl load-module module-loopback
```
2. Use pavucontrol to route audio to the loopback device

## Usage

1. Run the application:
```bash
# macOS/Linux
python translator_app.py

# Windows
python translator_app.py
```

2. Configure Translation:
   - Select your input language (source language of the audio)
   - Choose one or two output languages for translation
   - The settings will be saved automatically for future sessions

3. Audio Input Selection:
   - For system audio: 
     - macOS: Select "BlackHole 2ch"
     - Windows: Select "Virtual Audio Cable"
     - Linux: Select "Monitor of Null Output"
   - For microphone: Select your physical microphone device
   - You can switch between inputs without restarting the application

4. Translation Controls:
   - Click "Start" to begin translation
   - The window will stay on top of other applications
   - Adjust transparency using the slider if needed
   - Click "Stop" to pause translation
   - Clear the text area using the "Clear" button

## Troubleshooting

### Audio Setup Issues
#### macOS
- Verify BlackHole installation: `brew info blackhole-2ch`
- Check System Settings > Privacy & Security > Microphone permissions
- Ensure audio levels are not muted
- Test BlackHole by recording in QuickTime while playing audio

#### Windows
- Verify Virtual Audio Cable installation in Device Manager
- Check Windows Security > Microphone privacy settings
- Test VAC using the VAC Audio Repeater tool

#### Linux
- Check PulseAudio is running: `pulseaudio --check`
- Verify loopback module: `pactl list modules | grep loopback`
- Use pavucontrol to verify audio routing

### Translation Issues
- Verify your Azure credentials in the `.env` file
- Check your internet connection
- Ensure the selected languages are supported by Azure Speech Services
- Try restarting the application if translations stop working
- Check Azure portal for service status and quota limits

## Configuration

- Settings are automatically saved in `settings.json`
- The application remembers your:
  - Input/output language selections
  - Window position and transparency
  - Selected audio device
- Configuration file location: `./settings.json`

## Dependencies

- Python 3.11+
- python-dotenv: Environment variable management
- azure-cognitiveservices-speech: Azure Speech Services SDK
- pyaudio: Audio capture and processing
- tkinter: GUI framework (included with Python)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Thanks to [BlackHole](https://github.com/ExistentialAudio/BlackHole) for the virtual audio driver
- Azure Cognitive Services for the speech translation API
- Virtual Audio Cable for Windows audio routing
- PulseAudio for Linux audio system
