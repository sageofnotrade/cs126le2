import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="welcome-info">
          <div className="user-greeting">Welcome to Budget Tracker</div>
          <div className="action-buttons">
            <a href="/finances/add/" className="btn add-transaction-btn">
              <i className="bi bi-plus-circle" aria-hidden="true"></i>
              Add Transaction
            </a>
          </div>
        </div>
      </header>
      
      <section className="quick-stats" aria-labelledby="quick-stats-heading">
        <h2 id="quick-stats-heading" className="section-title">Monthly Summary</h2>
        <div className="stats-grid">
          <article className="stat-card income">
            <h3 className="stat-title">Income</h3>
            <div className="stat-icon">
              <i className="bi bi-graph-up-arrow" aria-hidden="true"></i>
            </div>
            <p className="stat-value">$1,452.00</p>
            <p className="stat-label">This Month</p>
          </article>
          
          <article className="stat-card expenses">
            <h3 className="stat-title">Expenses</h3>
            <div className="stat-icon">
              <i className="bi bi-graph-down-arrow" aria-hidden="true"></i>
            </div>
            <p className="stat-value">$573.53</p>
            <p className="stat-label">This Month</p>
          </article>
          
          <article className="stat-card balance">
            <h3 className="stat-title">Balance</h3>
            <div className="stat-icon">
              <i className="bi bi-wallet2" aria-hidden="true"></i>
            </div>
            <p className="stat-value">$878.47</p>
            <p className="stat-label">Net Savings</p>
          </article>
        </div>
      </section>
      
      <div className="dashboard-grid">
        <section className="transactions-section" aria-labelledby="recent-transactions-heading">
          <header className="section-header">
            <h2 id="recent-transactions-heading">Recent Transactions</h2>
            <a href="/finances/summary/" className="view-all-link">View All</a>
          </header>
          
          <div className="transaction-list">
            <table className="transactions-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Description</th>
                  <th scope="col">Category</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>05/10/2023</td>
                  <td>Grocery Shopping</td>
                  <td>Food</td>
                  <td className="expense">-$45.20</td>
                </tr>
                <tr>
                  <td>05/05/2023</td>
                  <td>Monthly Salary</td>
                  <td>Income</td>
                  <td className="income">+$1,250.00</td>
                </tr>
                <tr>
                  <td>05/03/2023</td>
                  <td>Electric Bill</td>
                  <td>Utilities</td>
                  <td className="expense">-$75.40</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        
        <section className="budget-section" aria-labelledby="budget-overview-heading">
          <h2 id="budget-overview-heading" className="section-title">Budget Overview</h2>
          <div className="budget-chart">
            <div className="chart-placeholder">
              <div className="pie-chart" aria-hidden="true"></div>
            </div>
            <div className="budget-legend">
              <div className="legend-item">
                <span className="legend-color housing"></span>
                <span className="legend-text">Housing (35%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color food"></span>
                <span className="legend-text">Food (25%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color transportation"></span>
                <span className="legend-text">Transportation (15%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color utilities"></span>
                <span className="legend-text">Utilities (10%)</span>
              </div>
              <div className="legend-item">
                <span className="legend-color other"></span>
                <span className="legend-text">Other (15%)</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard; 