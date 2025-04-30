import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from './components/HomePage';

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
  const homepageContainer = document.getElementById('react-homepage');
  
  if (homepageContainer) {
    ReactDOM.render(<HomePage />, homepageContainer);
  }
}); 