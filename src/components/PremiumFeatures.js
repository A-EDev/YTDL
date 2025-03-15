import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const plans = [
  {
    title: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Basic features for personal use',
    buttonText: 'Current Plan',
    buttonVariant: 'outlined',
    features: [
      { text: 'Download in 720p quality', included: true },
      { text: 'Convert to MP3', included: true },
      { text: 'Ad-supported experience', included: true },
      { text: '5 downloads per day', included: true },
      { text: 'HD and 4K downloads', included: false },
      { text: 'No advertisements', included: false },
      { text: 'Unlimited downloads', included: false },
      { text: 'Priority support', included: false }
    ]
  },
  {
    title: 'Premium',
    price: '$5.99',
    period: 'per month',
    description: 'All you need for unlimited downloading',
    buttonText: 'Get Premium',
    buttonVariant: 'contained',
    highlight: true,
    features: [
      { text: 'Download in 720p quality', included: true },
      { text: 'Convert to MP3', included: true },
      { text: 'Ad-free experience', included: true },
      { text: 'Unlimited downloads', included: true },
      { text: 'HD and 4K downloads', included: true },
      { text: 'Batch downloads', included: true },
      { text: 'Priority processing', included: true },
      { text: '24/7 Priority support', included: true }
    ]
  },
  {
    title: 'Team',
    price: '$19.99',
    period: 'per month',
    description: 'For small teams and businesses',
    buttonText: 'Contact Sales',
    buttonVariant: 'outlined',
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Up to 5 team members', included: true },
      { text: 'Team management console', included: true },
      { text: 'API access', included: true },
      { text: 'Usage analytics', included: true },
      { text: 'Custom branding options', included: true },
      { text: 'Enhanced security', included: true },
      { text: 'Dedicated account manager', included: true }
    ]
  }
];

const PremiumFeatures = () => {
  return (
    <Box className="app-section" component="section" id="premium" sx={{ mt: 10 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h2" fontWeight="bold" gutterBottom>
          Choose Your <span className="gradient-text">Plan</span>
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto' }}>
          Select the perfect plan for your needs and unlock premium features
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {plans.map((plan, index) => (
          <Grid item key={index} xs={12} sm={6} md={4}>
            <Card 
              elevation={plan.highlight ? 6 : 2}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 4,
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                transform: plan.highlight ? 'scale(1.05)' : 'scale(1)',
                '&:hover': {
                  transform: plan.highlight ? 'scale(1.08)' : 'scale(1.03)',
                  boxShadow: plan.highlight ? 8 : 4
                },
                ...(plan.highlight && {
                  border: '2px solid',
                  borderColor: 'primary.main',
                })
              }}
            >
              {plan.highlight && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 15,
                    right: 15,
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: '50px',
                    px: 2,
                    py: 0.5,
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  Popular
                </Box>
              )}
              
              <CardContent sx={{ p: 4, flexGrow: 1 }}>
                <Typography variant="h5" component="h3" fontWeight="bold" gutterBottom>
                  {plan.title}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                  <Typography variant="h3" component="span" fontWeight="bold">
                    {plan.price}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                    /{plan.period}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {plan.description}
                </Typography>
                
                <Divider sx={{ my: 3 }} />
                
                <List disablePadding>
                  {plan.features.map((feature, featureIndex) => (
                    <ListItem 
                      key={featureIndex} 
                      disableGutters 
                      sx={{ py: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 38 }}>
                        {feature.included ? (
                          <CheckCircleIcon color="success" fontSize="small" />
                        ) : (
                          <CancelIcon color="disabled" fontSize="small" />
                        )}
                      </ListItemIcon>
                      <ListItemText 
                        primary={feature.text} 
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          sx: {
                            textDecoration: !feature.included ? 'line-through' : 'none',
                            color: !feature.included ? 'text.disabled' : 'text.primary'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
              <Box sx={{ p: 4, pt: 0 }}>
                <Button
                  fullWidth
                  variant={plan.buttonVariant}
                  color="primary"
                  size="large"
                  sx={{
                    py: 1.5,
                    ...(plan.highlight && {
                      boxShadow: '0 4px 14px rgba(255, 0, 0, 0.25)',
                    })
                  }}
                >
                  {plan.buttonText}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default PremiumFeatures;
