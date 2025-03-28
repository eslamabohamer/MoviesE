
import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="w-full bg-card/60 backdrop-blur-lg border-t border-white/5 mt-20">
      <div className="max-w-screen-2xl mx-auto py-16 px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h2 className="text-xl font-bold mb-4">StreamHub</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your premium destination for movies and series, delivering exceptional streaming experiences.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider">Navigation</h3>
            <ul className="space-y-3">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/movies">Movies</FooterLink>
              <FooterLink to="/series">Series</FooterLink>
              <FooterLink to="/admin">Admin</FooterLink>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider">Legal</h3>
            <ul className="space-y-3">
              <FooterLink to="/terms">Terms of Service</FooterLink>
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/cookies">Cookie Policy</FooterLink>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold mb-4 uppercase tracking-wider">Contact</h3>
            <ul className="space-y-3">
              <FooterLink to="/help">Help Center</FooterLink>
              <FooterLink to="/contact">Contact Us</FooterLink>
              <FooterLink to="/faq">FAQ</FooterLink>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/5 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} StreamHub. All rights reserved.
          </p>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <SocialLink href="#" label="Twitter">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
            </SocialLink>
            <SocialLink href="#" label="Instagram">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </SocialLink>
            <SocialLink href="#" label="YouTube">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><path d="m10 15 5-3-5-3z"/></svg>
            </SocialLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

const FooterLink = ({ to, children }: { to: string; children: React.ReactNode }) => {
  return (
    <li>
      <Link to={to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        {children}
      </Link>
    </li>
  );
};

const SocialLink = ({ href, label, children }: { href: string; label: string; children: React.ReactNode }) => {
  return (
    <a 
      href={href} 
      aria-label={label}
      target="_blank" 
      rel="noopener noreferrer"
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </a>
  );
};

export default Footer;
