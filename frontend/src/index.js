import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import BudgetList from './components/BudgetList';  // Import BudgetList component

// App component
function App() {
    const [budgets, setBudgets] = useState([]);  // State to hold the budgets

    useEffect(() => {
        // Fetch the budgets from the Django backend (via the API)
        fetch('/api/get_budgets/')  // Ensure you have this API endpoint in Django
            .then(response => response.json())
            .then(data => setBudgets(data));  // Set the fetched data into the budgets state
    }, []);

    return <BudgetList budgets={budgets} />;  // Pass budgets as a prop to the BudgetList component
}

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
