import { useState, useEffect, useCallback } from 'react';

const Recorder = ({ socket, onError }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          socket.emit('audioData', event.data);
        }
      };

      recorder.start(100); // Collect 100ms chunks
      setMediaRecorder(recorder);
      setIsRecording(true);

      // Start translation on the server
      socket.emit('startTranslation', {
        inputLanguage: localStorage.getItem('inputLanguage') || 'en-US',
        outputLanguage: localStorage.getItem('outputLanguage') || 'yue',
        secondOutputLanguage: localStorage.getItem('secondOutputLanguage') || '',
      });
    } catch (error) {
      onError('Error accessing microphone: ' + error.message);
    }
  }, [socket, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      socket.emit('stopTranslation');
      setIsRecording(false);
    }
  }, [mediaRecorder, socket]);

  useEffect(() => {
    return () => {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        stopRecording();
      }
    };
  }, [mediaRecorder, stopRecording]);

  return (
    <button
      onClick={isRecording ? stopRecording : startRecording}
      className={`record-button ${isRecording ? 'recording' : ''}`}
    >
      {isRecording ? 'Stop' : 'Start Recording'}
    </button>
  );
};

export default Recorder;
