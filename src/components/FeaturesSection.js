import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  CardMedia,
  Icon
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import HighQualityIcon from '@mui/icons-material/HighQuality';
import SecurityIcon from '@mui/icons-material/Security';
import DevicesIcon from '@mui/icons-material/Devices';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';

const features = [
  {
    title: 'Lightning Fast',
    description: 'Download your videos in seconds with our optimized servers',
    icon: SpeedIcon,
    color: '#ff6b6b'
  },
  {
    title: 'High Quality',
    description: 'Download videos in the highest quality available up to 4K',
    icon: HighQualityIcon,
    color: '#48dbfb'
  },
  {
    title: 'Safe & Secure',
    description: 'No personal data stored, completely anonymous downloads',
    icon: SecurityIcon,
    color: '#1dd1a1'
  },
  {
    title: 'Multi-Format',
    description: 'Download as MP4, MP3, or other formats that suit your needs',
    icon: DevicesIcon,
    color: '#feca57'
  },
  {
    title: 'Unlimited Downloads',
    description: 'No limits on how many videos you can download',
    icon: CloudDownloadIcon,
    color: '#ff9ff3'
  },
  {
    title: 'User Friendly',
    description: 'Simple and intuitive interface for seamless experience',
    icon: ThumbUpAltIcon,
    color: '#a29bfe'
  }
];

const FeaturesSection = () => {
  return (
    <Box className="app-section" component="section" id="features" sx={{ mt: 10 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
          Why Choose Our <span className="gradient-text">YouTube Downloader</span>
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Packed with premium features to make downloading YouTube videos a breeze
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              className="hover-elevate" 
              sx={{ 
                height: '100%',
                borderRadius: 4,
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: '0 12px 20px rgba(0,0,0,0.1)'
                }
              }}
            >
              <CardContent sx={{ p: 4, textAlign: 'center' }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: `${feature.color}20`,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    mb: 3,
                    mx: 'auto'
                  }}
                >
                  <feature.icon 
                    sx={{ 
                      fontSize: 40, 
                      color: feature.color 
                    }} 
                  />
                </Box>
                <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                  {feature.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {feature.description}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FeaturesSection;
