import React from 'react';

const Features = () => {
  const features = [
    {
      icon: "bi bi-wallet2",
      title: "Smart Tracking",
      description: "Easily track all your income and expenses in one place with categorization.",
      gradient: "gradient-1",
      delay: 0
    },
    {
      icon: "bi bi-pie-chart-fill",
      title: "Visual Analytics",
      description: "See where your money goes with intuitive charts and insightful dashboards.",
      gradient: "gradient-2",
      delay: 0.2
    },
    {
      icon: "bi bi-bell-fill",
      title: "Budget Alerts",
      description: "Stay on budget with smart alerts when you're approaching spending limits.",
      gradient: "gradient-3",
      delay: 0.4
    },
    {
      icon: "bi bi-calendar-check",
      title: "Monthly Goals",
      description: "Set savings goals and track your progress to achieve financial freedom.",
      gradient: "gradient-4",
      delay: 0.6
    },
    {
      icon: "bi bi-file-earmark-spreadsheet",
      title: "Easy Export",
      description: "Export your financial data to CSV for tax reporting or advanced analysis.",
      gradient: "gradient-5",
      delay: 0.8
    },
    {
      icon: "bi bi-shield-lock",
      title: "Secure Data",
      description: "Your financial information is securely stored and never shared with third parties.",
      gradient: "gradient-6",
      delay: 1.0
    }
  ];

  return (
    <section className="features py-5 bg-light">
      <div className="container py-4">
        <div className="text-center mb-5">
          <span className="badge bg-primary-subtle text-primary px-3 py-2 mb-3 rounded-pill fade-in">
            <i className="bi bi-stars me-1"></i>Powerful Features
          </span>
          <h2 className="display-5 fw-bold fade-in">Everything You Need to Manage Your Money</h2>
          <p className="lead text-secondary mx-auto slide-up" style={{maxWidth: "700px"}}>
            Our budget tracker comes packed with all the tools you need to take control of your finances
          </p>
        </div>
        
        <div className="row g-4">
          {features.map((feature, index) => (
            <div className="col-md-6 col-lg-4" key={index}>
              <div 
                className="feature-card h-100 p-4 bg-white rounded-4 shadow-sm slide-up border-0" 
                style={{animationDelay: `${feature.delay}s`}}
              >
                <div className={`icon-container ${feature.gradient} mb-4 rounded-circle p-3 d-inline-flex`}>
                  <i className={`${feature.icon} fs-4 text-white`}></i>
                </div>
                <h3 className="h5 fw-bold mb-3">{feature.title}</h3>
                <p className="text-secondary mb-0">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center mt-5 pt-4 fade-in">
          <a href="/register/" className="btn btn-primary btn-lg px-4 py-2">
            <i className="bi bi-person-plus me-2"></i>Get Started Free
          </a>
          <p className="text-muted mt-2">
            <small><i className="bi bi-clock me-1"></i>Set up in under 2 minutes</small>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features; 