import { useState, useCallback } from 'react';

/**
 * A custom hook for handling clipboard operations
 */
const useClipboard = () => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback((text) => {
    return new Promise((resolve, reject) => {
      try {
        navigator.clipboard.writeText(text)
          .then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
            resolve(true);
          })
          .catch(err => {
            console.error('Failed to copy text: ', err);
            reject(err);
          });
      } catch (err) {
        console.error('Clipboard API not available: ', err);
        
        // Fallback method
        try {
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          document.body.removeChild(textArea);
          
          if (successful) {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
            resolve(true);
          } else {
            reject(new Error('Failed to copy using fallback method'));
          }
        } catch (err) {
          reject(err);
        }
      }
    });
  }, []);

  return { isCopied, copy };
};

export default useClipboard;
