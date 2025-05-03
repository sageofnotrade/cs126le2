import React from 'react';

const Hero = ({ isAuthenticated }) => {
  return (
    <section className="hero py-5">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 hero-text py-5">
            <span className="badge bg-primary-subtle text-primary px-3 py-2 mb-3 rounded-pill fade-in">
              <i className="bi bi-stars me-1"></i>Smart Personal Finance
            </span>
            <h1 className="display-4 fw-bold fade-in">Take Control of Your Money</h1>
            <p className="lead text-secondary mb-4 slide-up">
              Track expenses, visualize spending patterns, and achieve your financial goals with our powerful budget management solution.
            </p>
            
            <div className="features-overview mb-4 slide-up">
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-check-circle-fill text-success me-2"></i>
                <span>Simple expense tracking</span>
              </div>
              <div className="d-flex align-items-center mb-2">
                <i className="bi bi-check-circle-fill text-success me-2"></i>
                <span>Smart budget alerts</span>
              </div>
              <div className="d-flex align-items-center">
                <i className="bi bi-check-circle-fill text-success me-2"></i>
                <span>Insightful financial reports</span>
              </div>
            </div>
            
            {isAuthenticated ? (
              <div className="cta-buttons d-flex flex-wrap gap-3 slide-up-delay">
                <a href="/dashboard/" className="btn btn-primary btn-lg px-4 py-2">
                  <i className="bi bi-speedometer2 me-2"></i>Dashboard
                </a>
                <a href="/finances/add/" className="btn btn-outline-primary btn-lg px-4 py-2">
                  <i className="bi bi-plus-circle me-2"></i>Add Transaction
                </a>
              </div>
            ) : (
              <div className="cta-buttons d-flex flex-wrap gap-3 slide-up-delay">
                <button
                  type="button"
                  className="btn btn-primary btn-lg px-4 py-2"
                  onClick={() => window.openSignupModal && window.openSignupModal()}
                >
                  <i className="bi bi-person-plus me-2"></i>Get Started Free
                </button>
                <a href="/accounts/login/" className="btn btn-outline-primary btn-lg px-4 py-2">
                  <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
                </a>
              </div>
            )}
            
            <div className="mt-4 text-secondary slide-up-delay-more">
              <small>
                <i className="bi bi-shield-lock me-1"></i>
                Your data is secure. No credit card required.
              </small>
            </div>
          </div>
          <div className="col-lg-6 hero-image fade-in-right d-flex justify-content-center">
            <div className="position-relative">
              <div className="hero-blob-bg position-absolute top-0 start-0 translate-middle-x"></div>
              <img 
                src="/static/img/financial-chart.svg" 
                alt="Financial dashboard" 
                className="img-fluid position-relative z-1 dashboard-preview"
              />
              <div className="dashboard-card position-absolute bg-white shadow-sm rounded p-3 top-0 end-0 translate-middle-x">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-success p-2 me-2">
                    <i className="bi bi-graph-up-arrow text-white"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block">Income</small>
                    <span className="fw-bold text-success">+$1,240</span>
                  </div>
                </div>
              </div>
              <div className="dashboard-card position-absolute bg-white shadow-sm rounded p-3 bottom-0 start-0 translate-middle">
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-danger p-2 me-2">
                    <i className="bi bi-graph-down-arrow text-white"></i>
                  </div>
                  <div>
                    <small className="text-muted d-block">Expenses</small>
                    <span className="fw-bold text-danger">-$840</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 