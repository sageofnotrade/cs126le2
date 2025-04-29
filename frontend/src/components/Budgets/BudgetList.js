import React from 'react';
import BudgetCard from './BudgetCard';  // Import the BudgetCard component

function BudgetList({ budgets }) {
  // Separate the budgets into weekly and monthly
  const weeklyBudgets = budgets.filter(budget => budget.duration === '1 week');
  const monthlyBudgets = budgets.filter(budget => budget.duration === '1 month');

  return (
    <div className="container">
      <h3 className="text-center">Weekly Budgets</h3>
      <div className="row">
        {weeklyBudgets.map(budget => (
          <div className="col-md-4 mb-4" key={budget.id}>
            <BudgetCard budget={budget} />
          </div>
        ))}
      </div>

      <h3 className="text-center mt-5">Monthly Budgets</h3>
      <div className="row">
        {monthlyBudgets.map(budget => (
          <div className="col-md-4 mb-4" key={budget.id}>
            <BudgetCard budget={budget} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default BudgetList;