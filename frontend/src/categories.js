import React from 'react';
import ReactDOM from 'react-dom';
import Categories from './components/Categories';
import './index.css';

// Wait for DOM content to be loaded
document.addEventListener('DOMContentLoaded', () => {
    const categoriesRoot = document.getElementById('react-categories');
    
    if (categoriesRoot) {
        ReactDOM.render(<Categories />, categoriesRoot);
    }
}); 