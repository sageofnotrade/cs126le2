import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from './components/HomePage';
import Categories from './components/Categories';

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
  const homepageContainer = document.getElementById('react-homepage');
  const categoriesContainer = document.getElementById('react-categories');
  
  if (homepageContainer) {
    ReactDOM.render(<HomePage />, homepageContainer);
  }

  if (categoriesContainer) {
    ReactDOM.render(<Categories />, categoriesContainer);
  }
}); 