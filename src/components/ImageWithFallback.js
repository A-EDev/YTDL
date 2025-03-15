import React, { useState } from 'react';
import { Box } from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';

const ImageWithFallback = ({ src, alt, className, ...props }) => {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  if (error || !src) {
    return (
      <Box 
        className={className} 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.05)',
          borderRadius: 2,
          height: '100%',
          minHeight: 200,
          ...props.sx
        }}
      >
        <YouTubeIcon sx={{ fontSize: 64, color: 'primary.main', opacity: 0.7 }} />
      </Box>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt || "Video thumbnail"} 
      className={className} 
      onError={handleError}
      {...props}
    />
  );
};

export default ImageWithFallback;
