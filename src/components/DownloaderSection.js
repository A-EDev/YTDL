import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Paper,
  Tabs,
  Tab,
  Divider,
  Chip,
  CardMedia,
  MenuItem,
  IconButton
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import { toast } from 'react-toastify';
import { fetchVideoData, downloadVideo } from '../services/youtubeService';
import ImageWithFallback from './ImageWithFallback';

const DownloaderSection = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedFormat, setSelectedFormat] = useState('');

  const formatOptions = [
    { value: 'mp4-360p', label: 'MP4 360p' },
    { value: 'mp4-720p', label: 'MP4 720p' },
    { value: 'mp4-1080p', label: 'MP4 1080p' },
    { value: 'mp3-128', label: 'MP3 128kbps' },
    { value: 'mp3-256', label: 'MP3 256kbps' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    // Improved URL validation
    const isValidUrl = (url.includes('youtube.com/') || url.includes('youtu.be/')) && 
                       (url.includes('/watch?') || url.includes('youtu.be/'));
                       
    if (!isValidUrl) {
      toast.error('Please enter a valid YouTube URL (e.g., https://youtube.com/watch?v=xxx or https://youtu.be/xxx)');
      return;
    }

    setLoading(true);
    toast.info('Fetching video information...'); // Give immediate feedback
    
    try {
      console.log('Submitting URL:', url);
      // Use our service to fetch video data
      const response = await fetchVideoData(url);
      console.log('Video data received:', response.data);
      
      // Verify we got some formats
      if (!response.data.formats || response.data.formats.length === 0) {
        toast.warning("Couldn't detect video formats. Using default options.");
      }
      
      setVideoData(response.data);
      setSelectedFormat(''); // Reset format selection
      toast.success('Video found! Select a format to download.');
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error(error.message || 'Error fetching video data. Please try a different video or try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedFormat) {
      toast.warning('Please select a format first');
      return;
    }
    
    // Extract format and quality info
    const [format, quality] = selectedFormat.split('-');
    
    // Show downloading indicator
    setLoading(true);
    
    try {
      await downloadVideo(url, format, quality);
      
      // Show a message to explain what should happen
      setTimeout(() => {
        toast.info('If your download doesn\'t start automatically:', {
          position: "bottom-right",
          autoClose: false,
        });
        
        toast.info(
          <div>
            <p>1. Try right-clicking the Download button and select "Save Link As"</p>
            <p>2. Try MP3 format instead of video format</p>
            <p>3. Try a different YouTube video</p>
          </div>,
          {
            position: "bottom-right",
            autoClose: false,
          }
        );
      }, 5000);
      
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Download failed: ${error.message}. Please try a different format or video.`);
    } finally {
      setLoading(false);
    }
  };

  const getDirectDownloadUrl = () => {
    if (!url || !selectedFormat) return '#';
    const [format, quality] = selectedFormat.split('-');
    return `/api/video/download?url=${encodeURIComponent(url)}&format=${format}&quality=${quality}`;
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleFormatChange = (event) => {
    setSelectedFormat(event.target.value);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  return (
    <Box className="app-section" component="section" id="downloader" sx={{ mt: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" fontWeight="bold" gutterBottom>
          Download YouTube Videos <span className="gradient-text">Easily</span>
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          The fastest, easiest way to download your favorite YouTube videos in HD quality
        </Typography>
      </Box>
      
      <Card 
        elevation={4} 
        sx={{ 
          borderRadius: 4,
          overflow: 'visible',
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))',
          backdropFilter: 'blur(10px)',
          px: { xs: 2, md: 4 },
          py: { xs: 3, md: 4 }
        }}
      >
        <CardContent>
          <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={9}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Paste YouTube URL here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <LinkIcon sx={{ mr: 1, color: 'primary.light' }} />
                    ),
                  }}
                  sx={{ bgcolor: 'white', borderRadius: 2 }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <Button 
                  fullWidth 
                  type="submit"
                  variant="contained" 
                  color="primary" 
                  size="large" 
                  disabled={loading}
                  sx={{ 
                    height: '100%',
                    boxShadow: '0 4px 14px rgba(255, 0, 0, 0.25)',
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Download'}
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {videoData && (
            <Paper elevation={0} sx={{ bgcolor: 'rgba(255,255,255,0.7)', p: 2, borderRadius: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <ImageWithFallback
                    component="img"
                    image={videoData.thumbnail}
                    src={videoData.thumbnail}
                    alt={videoData.title}
                    className="video-preview"
                  />
                </Grid>
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {videoData.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                      {videoData.author}
                    </Typography>
                    <Chip 
                      label={videoData.duration} 
                      size="small" 
                      sx={{ mr: 1, bgcolor: 'rgba(0,0,0,0.08)' }} 
                    />
                    <Chip 
                      label={`${videoData.views} views`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(0,0,0,0.08)' }} 
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                      Select Format:
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <TextField
                          select
                          fullWidth
                          value={selectedFormat}
                          onChange={handleFormatChange}
                          variant="outlined"
                          sx={{ bgcolor: 'white' }}
                        >
                          <MenuItem value="" disabled>
                            Choose a format
                          </MenuItem>
                          {(videoData.formats && videoData.formats.length > 0) ? (
                            videoData.formats.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <span>{option.label}</span>
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    {option.size}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))
                          ) : (
                            // Default options if no formats are available
                            [
                              { value: 'mp4-720p', label: 'MP4 720p', size: 'Variable' },
                              { value: 'mp4-360p', label: 'MP4 360p', size: 'Variable' },
                              { value: 'mp3-128', label: 'MP3 128kbps', size: 'Variable' }
                            ].map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                                  <span>{option.label}</span>
                                  <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                                    {option.size}
                                  </Typography>
                                </Box>
                              </MenuItem>
                            ))
                          )}
                        </TextField>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                          component="a"
                          href={getDirectDownloadUrl()}
                          target="_blank"
                          download
                          disabled={!selectedFormat || loading}
                          onClick={(e) => {
                            e.preventDefault(); // Prevent default anchor behavior
                            handleDownload(); // Use our custom handler
                          }}
                        >
                          {loading ? 'Downloading...' : 'Download'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                      URL:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      component="div" 
                      sx={{ 
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {url}
                    </Typography>
                    <IconButton size="small" onClick={copyLink}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default DownloaderSection;
