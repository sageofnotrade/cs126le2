import React, { useEffect, useState } from 'react';
import Hero from './Hero';
import Features from './Features';
import Testimonial from './Testimonial';
import CallToAction from './CallToAction';
import BudgetList from './Budgets/BudgetList';  // Import the BudgetList component

const HomePage = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [budgets, setBudgets] = useState([]);  // State to hold the fetched budgets

  useEffect(() => {
    // Get authentication status from Django context (passed via data attribute)
    const homepageElement = document.getElementById('react-homepage');
    if (homepageElement) {
      setIsAuthenticated(homepageElement.dataset.authenticated === 'true');
    }

    // Fetch budget data from the API
    fetch('/api/get_budgets/')  // Ensure you have an endpoint to fetch budgets
      .then(response => response.json())
      .then(data => setBudgets(data));  // Set the fetched data into state
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