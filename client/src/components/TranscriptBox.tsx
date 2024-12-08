import React, { useRef, useEffect } from 'react';
import { TranscriptEntry } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface TranscriptBoxProps {
  transcripts: TranscriptEntry[];
}

const TranscriptBox: React.FC<TranscriptBoxProps> = ({ transcripts }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div ref={scrollRef} className="p-4 sm:p-6 h-[calc(100vh-12rem)] overflow-y-auto bg-white dark:bg-gray-800 transition-colors duration-300">
      <AnimatePresence>
        {transcripts.map((entry, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6 last:mb-0 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm"
          >
            <div className="text-lg font-semibold text-indigo-700 dark:text-indigo-300 mb-2">{entry.original}</div>
            {Object.entries(entry.translations).map(([lang, text]) => (
              <div key={lang} className="mt-2">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{lang}:</span>
                <span className="ml-2 text-gray-800 dark:text-gray-200">{text}</span>
              </div>
            ))}
          </motion.div>
        ))}
      </AnimatePresence>
      {transcripts.length === 0 && (
        <div className="text-center text-gray-500 dark:text-gray-400 mt-20">
          No transcripts yet. Start recording to see translations.
        </div>
      )}
    </div>
  );
};

export default TranscriptBox;

