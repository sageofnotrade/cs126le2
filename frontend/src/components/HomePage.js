import React, { useEffect, useState } from 'react';
import Hero from './Hero';
import Features from './Features';
import Testimonial from './Testimonial';
import CallToAction from './CallToAction';

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  useEffect(() => {
    // Get authentication status from Django context
    const homepageElement = document.getElementById('react-homepage');
    if (homepageElement) {
      setIsAuthenticated(homepageElement.dataset.authenticated === 'true');
    }
  }, []);

  return (
    <div className="homepage-container">
      <Hero isAuthenticated={isAuthenticated} />
      <Features />
      <Testimonial />
      {!isAuthenticated && <CallToAction />}
    </div>
  );
};

export default HomePage; 