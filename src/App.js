import React from 'react';
import { Container, CssBaseline } from '@mui/material';
import './App.css';
import Header from './components/Header';
import DownloaderSection from './components/DownloaderSection';
import FeaturesSection from './components/FeaturesSection';
import PremiumFeatures from './components/PremiumFeatures';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <CssBaseline />
      <ToastContainer position="top-right" autoClose={5000} theme="colored" />
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <DownloaderSection />
        <FeaturesSection />
        <PremiumFeatures />
        <FAQSection />
      </Container>
      <Footer />
    </>
  );
}

export default App;
