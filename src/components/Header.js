import React, { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Box, 
  Container,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import YouTubeIcon from '@mui/icons-material/YouTube';

const Header = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '#' },
    { name: 'Features', href: '#features' },
    { name: 'FAQ', href: '#faq' },
    { name: 'Contact', href: '#contact' },
  ];

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === 'keydown' &&
      (event.key === 'Tab' || event.key === 'Shift')
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ bgcolor: 'background.paper' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <YouTubeIcon sx={{ color: 'primary.main', mr: 1, fontSize: 32 }} />
            <Typography variant="h5" component="div" fontWeight="bold">
              YT Premium
            </Typography>
          </Box>

          {isMobile ? (
            <>
              <IconButton 
                edge="end" 
                color="primary" 
                aria-label="menu"
                onClick={toggleDrawer(true)}
              >
                <MenuIcon />
              </IconButton>
              <Drawer 
                anchor="right" 
                open={drawerOpen} 
                onClose={toggleDrawer(false)}
              >
                <Box 
                  sx={{ width: 250 }} 
                  role="presentation" 
                  onClick={toggleDrawer(false)} 
                  onKeyDown={toggleDrawer(false)}
                >
                  <List>
                    {navItems.map((item) => (
                      <ListItem button key={item.name} component="a" href={item.href}>
                        <ListItemText primary={item.name} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.name}
                  color="inherit"
                  href={item.href}
                  sx={{ mx: 1 }}
                >
                  {item.name}
                </Button>
              ))}
              <Button 
                variant="contained" 
                color="primary" 
                sx={{ ml: 2 }}
              >
                Go Premium
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;
