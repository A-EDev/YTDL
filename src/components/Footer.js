import React from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  Grid, 
  Link, 
  Divider,
  IconButton,
  Stack
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import GitHubIcon from '@mui/icons-material/GitHub';
import YouTubeIcon from '@mui/icons-material/YouTube';

const Footer = () => {
  const footerLinks = [
    {
      title: 'Product',
      links: [
        { text: 'Features', url: '#features' },
        { text: 'Premium', url: '#premium' },
        { text: 'Pricing', url: '#pricing' },
        { text: 'API', url: '#api' },
      ]
    },
    {
      title: 'Resources',
      links: [
        { text: 'Documentation', url: '#docs' },
        { text: 'Blog', url: '#blog' },
        { text: 'Support', url: '#support' },
        { text: 'FAQ', url: '#faq' },
      ]
    },
    {
      title: 'Company',
      links: [
        { text: 'About Us', url: '#about' },
        { text: 'Careers', url: '#careers' },
        { text: 'Contact', url: '#contact' },
        { text: 'Partners', url: '#partners' },
      ]
    },
    {
      title: 'Legal',
      links: [
        { text: 'Privacy Policy', url: '#privacy' },
        { text: 'Terms of Service', url: '#terms' },
        { text: 'Cookie Policy', url: '#cookie' },
        { text: 'DMCA', url: '#dmca' },
      ]
    },
  ];
  
  const socialMedia = [
    { icon: FacebookIcon, url: '#', color: '#1877F2' },
    { icon: TwitterIcon, url: '#', color: '#1DA1F2' },
    { icon: InstagramIcon, url: '#', color: '#E4405F' },
    { icon: GitHubIcon, url: '#', color: '#333333' },
    { icon: YouTubeIcon, url: '#', color: '#FF0000' },
  ];

  return (
    <Box component="footer" sx={{ bgcolor: 'background.paper', pt: 8, pb: 6 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <YouTubeIcon sx={{ color: 'primary.main', mr: 1, fontSize: 32 }} />
              <Typography variant="h5" component="div" fontWeight="bold">
                YT Premium
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 300 }}>
              The best YouTube downloader for high-quality videos and audio extraction.
              Fast, secure, and easy to use.
            </Typography>
            <Stack direction="row" spacing={1}>
              {socialMedia.map((social, index) => (
                <IconButton 
                  key={index}
                  aria-label={`${social.icon.name} link`}
                  component="a"
                  href={social.url}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: social.color }
                  }}
                >
                  <social.icon />
                </IconButton>
              ))}
            </Stack>
          </Grid>
          
          {footerLinks.map((column, index) => (
            <Grid item xs={6} sm={3} md={2} key={index}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {column.title}
              </Typography>
              <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0 }}>
                {column.links.map((link, linkIndex) => (
                  <Box component="li" key={linkIndex} sx={{ mb: 1 }}>
                    <Link 
                      href={link.url} 
                      color="text.secondary" 
                      underline="hover"
                      sx={{ 
                        fontSize: '0.875rem',
                        transition: 'color 0.2s',
                        '&:hover': { color: 'primary.main' }
                      }}
                    >
                      {link.text}
                    </Link>
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
        
        <Divider sx={{ my: 4 }} />
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {new Date().getFullYear()} YT Premium. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="#privacy" color="text.secondary" underline="hover" variant="body2">
              Privacy
            </Link>
            <Link href="#terms" color="text.secondary" underline="hover" variant="body2">
              Terms
            </Link>
            <Link href="#cookies" color="text.secondary" underline="hover" variant="body2">
              Cookies
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
