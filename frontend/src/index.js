import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import HomePage from './components/HomePage';
import Categories from './components/Categories';
import './index.css';

function App() {
    const [budgets, setBudgets] = useState([]);

    useEffect(() => {
        fetch('/api/get_budgets/')
            .then(response => response.json())
            .then(data => setBudgets(data));
    }, []);

    return <BudgetList budgets={budgets} />;
}

document.addEventListener('DOMContentLoaded', () => {
    const rootElement = document.getElementById('react-root');
    
    if (rootElement) {
        ReactDOM.render(<App />, rootElement);
    }
});
