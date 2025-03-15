import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  Paper
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const faqs = [
  {
    question: 'Is it legal to download YouTube videos?',
    answer: 'Downloading YouTube videos for personal use is generally acceptable, but redistributing or using them commercially may violate copyright laws. Please ensure you have the right to download any content and always respect copyright owners.'
  },
  {
    question: 'What video formats are supported?',
    answer: 'We support a variety of formats including MP4, WebM, 3GP for video, and MP3, AAC, FLAC for audio. You can choose the quality and format that best suits your needs.'
  },
  {
    question: 'Is there a limit on how many videos I can download?',
    answer: 'There is no limit on the number of downloads for free users, but we do have fair usage policies in place. Premium users get priority access to our servers during peak times.'
  },
  {
    question: 'How do I download a YouTube playlist?',
    answer: 'Simply paste the URL of the playlist in the download box, and our system will detect it as a playlist. You can then choose to download individual videos or the entire playlist at once.'
  },
  {
    question: 'Do you store the downloaded videos on your servers?',
    answer: 'No, we don\'t store any downloaded videos or user data. All downloads are processed in real-time and delivered directly to your device.'
  },
  {
    question: 'Is this service completely free?',
    answer: 'We offer both free and premium tiers. The free tier provides all the basic functionality, while our premium service offers higher quality options, faster downloads, and no ads.'
  }
];

const FAQSection = () => {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <Box className="app-section" component="section" id="faq" sx={{ mt: 10 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
          Frequently Asked <span className="gradient-text">Questions</span>
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Get answers to the most common questions about our YouTube downloader
        </Typography>
      </Box>

      <Paper 
        elevation={2} 
        sx={{ 
          borderRadius: 4,
          overflow: 'hidden',
          bgcolor: 'background.paper'
        }}
      >
        {faqs.map((faq, index) => (
          <Accordion 
            key={index} 
            expanded={expanded === `panel${index}`} 
            onChange={handleChange(`panel${index}`)}
            disableGutters
            elevation={0}
            sx={{
              '&:before': {
                display: 'none',
              },
              borderBottom: index !== faqs.length - 1 ? '1px solid rgba(0, 0, 0, 0.08)' : 'none'
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`panel${index}bh-content`}
              id={`panel${index}bh-header`}
              sx={{ 
                p: 2.5,
                '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
              }}
            >
              <Typography variant="h6" fontWeight={500}>
                {faq.question}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 3, pt: 0, pb: 4, bgcolor: 'rgba(0, 0, 0, 0.01)' }}>
              <Typography variant="body1" color="text.secondary">
                {faq.answer}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Paper>
    </Box>
  );
};

export default FAQSection;
