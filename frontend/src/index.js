import React from 'react';
import ReactDOM from 'react-dom';
import HomePage from './components/HomePage';
import Categories from './components/Categories/Categories';
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
    const homepageContainer = document.getElementById('react-homepage');
    
<<<<<<< Updated upstream
    if (rootElement) {
        ReactDOM.render(<App />, rootElement);
=======
    if (homepageContainer) {
        ReactDOM.render(<HomePage />, homepageContainer);
    }
    
    const categoriesContainer = document.getElementById('react-categories');
    
    if (categoriesContainer) {
        ReactDOM.render(<Categories />, categoriesContainer);
>>>>>>> Stashed changes
    }
});
