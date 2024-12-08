import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Recorder from './components/Recorder';
import Transcript from './components/Transcript';
import Settings from './components/Settings';
import './App.css';

const socket = io('http://localhost:3001');

function App() {
  const [transcripts, setTranscripts] = useState([]);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('error', (error) => {
      setError(error.message);
    });

    socket.on('partialTranscript', (data) => {
      setTranscripts(prev => {
        const newTranscripts = [...prev];
        if (newTranscripts.length > 0 && newTranscripts[newTranscripts.length - 1].type === 'partial') {
          newTranscripts[newTranscripts.length - 1] = { ...data, type: 'partial' };
        } else {
          newTranscripts.push({ ...data, type: 'partial' });
        }
        return newTranscripts;
      });
    });

    socket.on('finalTranscript', (data) => {
      setTranscripts(prev => {
        const newTranscripts = [...prev];
        if (newTranscripts.length > 0 && newTranscripts[newTranscripts.length - 1].type === 'partial') {
          newTranscripts[newTranscripts.length - 1] = { ...data, type: 'final' };
        } else {
          newTranscripts.push({ ...data, type: 'final' });
        }
        return newTranscripts;
      });
    });

    return () => {
      socket.off('connect');
      socket.off('error');
      socket.off('partialTranscript');
      socket.off('finalTranscript');
    };
  }, []);

  const handleError = (message) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  return (
    <div className="app" data-theme={theme}>
      <header>
        <h1>Real-Time Speech Translator</h1>
        <Settings onThemeChange={setTheme} />
      </header>

      <main>
        <div className="controls">
          <Recorder socket={socket} onError={handleError} />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <Transcript transcripts={transcripts} />
      </main>
    </div>
  );
}

export default App;
