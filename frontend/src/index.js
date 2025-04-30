import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import HomePage from './components/HomePage';
import Categories from './components/Categories';
import './index.css';

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('react-root');
    
    if (rootElement) {
        ReactDOM.render(<App />, rootElement);  // Render the App component
    }
});
