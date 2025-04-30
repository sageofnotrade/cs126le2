import React from 'react';

function BudgetCard({ budget }) {
  const { category, amount, spent, remaining, start_date, end_date, percentage_used } = budget;
  const progressClass = percentage_used > 80 ? 'bg-danger' : (percentage_used > 60 ? 'bg-warning' : 'bg-success');

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h5 className="card-title">{category}</h5>
        <p className="card-text">Start Date: {new Date(start_date).toLocaleDateString()}</p>
        <p className="card-text">End Date: {new Date(end_date).toLocaleDateString()}</p>
        <p className="card-text">Residual Amount: ${remaining.toFixed(2)}</p>
        
        <div className="progress" style={{ height: '20px' }}>
          <div
            className={`progress-bar ${progressClass}`}
            role="progressbar"
            style={{ width: `${percentage_used}%` }}
            aria-valuenow={percentage_used}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            {percentage_used}%
          </div>
        </div>

        <div className="mt-3 d-flex justify-content-between">
          <button className="btn btn-sm btn-primary" onClick={() => alert('Edit functionality')}>
            <i className="fas fa-pencil-alt"></i> Edit
          </button>
          <button className="btn btn-sm btn-danger" onClick={() => alert('Delete functionality')}>
            <i className="fas fa-trash-alt"></i> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default BudgetCard;