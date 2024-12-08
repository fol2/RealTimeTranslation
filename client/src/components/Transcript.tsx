import { useEffect, useRef } from 'react';
import { TranscriptProps } from '../types';

const Transcript: React.FC<TranscriptProps> = ({ transcripts }) => {
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="transcript-container" ref={transcriptRef}>
      {transcripts.map((transcript, index) => (
        <div key={index} className={`transcript-entry ${transcript.type}`}>
          <div className="original-text">{transcript.original}</div>
          {Object.entries(transcript.translations).map(([lang, text]) => (
            <div key={lang} className="translation">
              <span className="language-code">{lang}:</span> {text}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Transcript;
