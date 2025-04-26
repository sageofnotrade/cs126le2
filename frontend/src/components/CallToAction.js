import React from 'react';

const CallToAction = () => {
  return (
    <section className="cta-section">
      <div className="container text-center">
        <h2 className="fade-in">Ready to take control?</h2>
        <p className="lead fade-in">Join thousands of users managing their finances effectively</p>
        <div className="cta-buttons d-flex flex-wrap justify-content-center gap-3">
          <a
            href="/signup/"
            className="btn btn-primary btn-lg px-4 me-md-2 animate-up"
          >
            <i className="bi bi-person-plus me-2"></i>Register Now
          </a>
          <a
            href="/accounts/login/"
            className="btn btn-outline-light btn-lg px-4 animate-up-delay"
          >
            <i className="bi bi-box-arrow-in-right me-2"></i>Sign In
          </a>
        </div>
      </div>
    </section>
  );
};

export default CallToAction; 