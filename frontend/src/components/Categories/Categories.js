import React, { useState, useEffect } from 'react';
import './Categories.css';

const Categories = () => {
  const [activeTab, setActiveTab] = useState('expenses');
  const [categories, setCategories] = useState({
    income: [],
    expenses: []
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch categories from backend
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/finances/api/categories/');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch categories: ${response.status}`);
        }
        
        const data = await response.json();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError('Failed to load categories. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }
    
    try {
      const response = await fetch('/finances/api/categories/add/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken(),
        },
        body: JSON.stringify({
          name: newCategoryName,
          type: activeTab === 'income' ? 'income' : 'expense'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add category: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update the categories state with the new category
      setCategories(prevCategories => {
        return {
          ...prevCategories,
          [activeTab]: [...prevCategories[activeTab], data.category]
        };
      });
      
      // Reset the input field
      setNewCategoryName('');
    } catch (err) {
      console.error('Error adding category:', err);
      alert('Failed to add category. Please try again.');
    }
  };

  // Helper function to get the CSRF token from cookies
  const getCsrfToken = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  };

  return (
    <div className="categories-container">
      <header className="categories-header">
        <h1>Categories management</h1>
      </header>

      <div className="categories-tabs">
        <ul className="nav nav-tabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button 
              className={`nav-link ${activeTab === 'income' ? 'active' : ''}`}
              onClick={() => setActiveTab('income')}
              role="tab"
              aria-selected={activeTab === 'income'}
            >
              Income
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button 
              className={`nav-link ${activeTab === 'expenses' ? 'active' : ''}`}
              onClick={() => setActiveTab('expenses')}
              role="tab"
              aria-selected={activeTab === 'expenses'}
            >
              Expenses
            </button>
          </li>
        </ul>
      </div>

      <div className="categories-content">
        {isLoading ? (
          <div className="text-center p-4">
            <p>Loading categories...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : (
          <div className="tab-content">
            <div className={`tab-pane fade ${activeTab === 'income' ? 'show active' : ''}`}>
              {categories.income.length === 0 ? (
                <div className="text-center p-4">
                  <p>No income categories found. Add your first one below!</p>
                </div>
              ) : (
                <ul className="categories-list">
                  {categories.income.map(category => (
                    <li key={category.id} className="category-item">
                      <div className="category-icon">
                        <i className={`bi ${category.icon}`} aria-hidden="true"></i>
                      </div>
                      <div className="category-name">{category.name}</div>
                      <div className="category-actions">
                        <button className="expand-button">
                          <i className="bi bi-chevron-down" aria-hidden="true"></i>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={`tab-pane fade ${activeTab === 'expenses' ? 'show active' : ''}`}>
              {categories.expenses.length === 0 ? (
                <div className="text-center p-4">
                  <p>No expense categories found. Add your first one below!</p>
                </div>
              ) : (
                <ul className="categories-list">
                  {categories.expenses.map(category => (
                    <li key={category.id} className="category-item">
                      <div className="category-icon">
                        <i className={`bi ${category.icon}`} aria-hidden="true"></i>
                      </div>
                      <div className="category-name">{category.name}</div>
                      <div className="category-actions">
                        <button className="expand-button">
                          <i className="bi bi-chevron-down" aria-hidden="true"></i>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
        
        <div className="add-category">
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder="Enter category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
            />
            <button 
              className="btn btn-primary"
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              <i className="bi bi-plus-lg" aria-hidden="true"></i> Add Category
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories; 