import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * Service for interacting with our Python YouTube download API
 */

const fetchVideoData = async (url) => {
  try {
    console.log('Fetching video info for:', url);
    
    // Clean up the URL if needed
    let cleanUrl = url;
    
    // Add retry logic for better reliability
    let attempts = 0;
    const maxAttempts = 3; // Increase max attempts
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`Attempt ${attempts}/${maxAttempts} to fetch video info`);
        
        const response = await axios.get(`/api/video/info?url=${encodeURIComponent(cleanUrl)}`, {
          // Add timeout to prevent hanging requests
          timeout: 15000,
        });
        
        console.log('Video info response:', response.data);
        return response;
      } catch (error) {
        console.error(`Attempt ${attempts} failed:`, error);
        
        // Detailed error handling
        if (error.response) {
          // The request was made and the server responded with a status code
          console.error(`Server responded with status ${error.response.status}:`, error.response.data);
          
          if (error.response.status === 400 && attempts >= maxAttempts) {
            throw new Error(error.response.data.error || 'Invalid YouTube URL');
          }
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
        } else {
          // Something happened in setting up the request
          console.error('Request setup error:', error.message);
        }
        
        if (attempts >= maxAttempts) {
          throw error; // Re-throw if max attempts reached
        }
        
        // Increase delay between retries
        const delay = attempts * 1000; // 1s, 2s, 3s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  } catch (error) {
    console.error('Error in fetchVideoData:', error);
    
    // More user-friendly error messages
    if (error.response?.status === 400) {
      throw new Error(error.response.data.error || 'Invalid YouTube URL. Please check the URL and try again.');
    } else if (error.response?.status === 500) {
      throw new Error('Server had trouble processing this video. Try a different video or try again later.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Connection timeout. The server is taking too long to respond.');
    } else {
      const errorMessage = error.response?.data?.error || 
                          'Error fetching video data. The video might be private or restricted.';
      throw new Error(errorMessage);
    }
  }
};

const downloadVideo = async (url, format, quality) => {
  try {
    console.log(`Starting download: ${url} in format ${format}, quality ${quality}`);
    
    toast.info('Preparing your download...', {
      position: "bottom-right",
      autoClose: 3000
    });

    // Create the download URL
    const downloadUrl = `/api/video/download?url=${encodeURIComponent(url)}&format=${format}&quality=${quality}`;
    
    // METHOD 1: Create a hidden link and click it (most reliable cross-browser method)
    const downloadLink = document.createElement('a');
    downloadLink.href = downloadUrl;
    downloadLink.download = `youtube-download.${format === 'mp3' ? 'mp3' : 'mp4'}`;
    document.body.appendChild(downloadLink);
    
    console.log('Triggering download via click...');
    downloadLink.click();
    
    // Small delay before removing the link
    setTimeout(() => {
      document.body.removeChild(downloadLink);
    }, 100);
    
    toast.success('Download started! Check your downloads folder.', {
      position: "bottom-right",
      autoClose: 5000
    });
    
    // METHOD 2: Also try the iframe method as a backup
    setTimeout(() => {
      console.log('Using iframe fallback method...');
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      
      // Clean up iframe after a delay
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 60000); // Remove after 1 minute
    }, 1000);
    
    return { success: true };
  } catch (error) {
    console.error('Download failed:', error);
    
    toast.error(`Download failed: ${error.message || 'Unknown error'}. Try a different format or video.`, {
      position: "bottom-right",
      autoClose: 5000
    });
    
    throw error;
  }
};

export { fetchVideoData, downloadVideo };
export default fetchVideoData;
