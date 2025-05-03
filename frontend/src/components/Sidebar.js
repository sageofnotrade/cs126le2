import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Logic to apply dark mode to the application would go here
  };

  return (
    <aside className="sidebar">
      <header className="app-title">
        <div className="logo-icon">
          <i className="bi bi-wallet2"></i>
        </div>
        <h1>Budget Tracker</h1>
      </header>
      
      <nav className="sidebar-nav" aria-label="Main Navigation">
        <ul>
          <li>
            <a href="/dashboard/" className="nav-item active">
              <i className="bi bi-speedometer2" aria-hidden="true"></i>
              <span className="text">Dashboard</span>
            </a>
          </li>
          <li>
            <a href="/finances/summary/" className="nav-item">
              <i className="bi bi-journal-text" aria-hidden="true"></i>
              <span className="text">Transactions</span>
            </a>
          </li>
          <li>
            <a href="#scheduled" className="nav-item">
              <i className="bi bi-calendar-check" aria-hidden="true"></i>
              <span className="text">Scheduled transactions</span>
            </a>
          </li>
          <li>
            <a href="#accounts" className="nav-item">
              <i className="bi bi-bank" aria-hidden="true"></i>
              <span className="text">Accounts</span>
            </a>
          </li>
          <li>
            <a href="#credit-cards" className="nav-item">
              <i className="bi bi-credit-card" aria-hidden="true"></i>
              <span className="text">Credit cards</span>
            </a>
          </li>
          <li>
            <a href="/finances/budget/" className="nav-item">
              <i className="bi bi-pie-chart" aria-hidden="true"></i>
              <span className="text">Budgets</span>
            </a>
          </li>
          <li>
            <a href="/finances/categories/" className="nav-item">
              <i className="bi bi-tag" aria-hidden="true"></i>
              <span className="text">Categories</span>
            </a>
          </li>
          <li>
            <a href="#debts" className="nav-item">
              <i className="bi bi-cash-stack" aria-hidden="true"></i>
              <span className="text">Debts</span>
            </a>
          </li>
          <li>
            <a href="#charts" className="nav-item">
              <i className="bi bi-bar-chart" aria-hidden="true"></i>
              <span className="text">Charts</span>
            </a>
          </li>
          <li>
            <a href="#calendar" className="nav-item">
              <i className="bi bi-calendar-week" aria-hidden="true"></i>
              <span className="text">Calendar</span>
            </a>
          </li>
          <li>
            <a href="/finances/export/" className="nav-item">
              <i className="bi bi-box-arrow-up" aria-hidden="true"></i>
              <span className="text">Import/Export</span>
            </a>
          </li>
          <li>
            <a href="#preferences" className="nav-item">
              <i className="bi bi-sliders" aria-hidden="true"></i>
              <span className="text">Preferences</span>
            </a>
          </li>
          <li>
            <a href="#settings" className="nav-item">
              <i className="bi bi-gear" aria-hidden="true"></i>
              <span className="text">Settings</span>
            </a>
          </li>
          <li>
            <a href="#help" className="nav-item">
              <i className="bi bi-question-circle" aria-hidden="true"></i>
              <span className="text">Help</span>
            </a>
          </li>
        </ul>
      </nav>
      
      <footer className="dark-mode-toggle">
        <span id="dark-mode-label">Dark mode</span>
        <label className="switch" htmlFor="dark-mode-toggle">
          <input 
            type="checkbox" 
            id="dark-mode-toggle"
            checked={isDarkMode} 
            onChange={toggleDarkMode}
            aria-labelledby="dark-mode-label"
          />
          <span className="slider round"></span>
        </label>
      </footer>
    </aside>
  );
};

export default Sidebar; 