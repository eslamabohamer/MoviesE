
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-lg w-full backdrop-blur-lg bg-background/30 border border-white/10 rounded-lg p-12 shadow-xl">
          <h1 className="text-8xl font-bold text-primary mb-6">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-white/70 mb-8">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
          <Link 
            to="/" 
            className="inline-block px-6 py-3 bg-primary rounded-md text-white font-medium hover:bg-primary/90 transition-all"
          >
            Return to Home
          </Link>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default NotFound;
