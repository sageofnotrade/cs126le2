import React, { useState, useEffect } from 'react';
import './Categories.css';

const Categories = () => {
  const [activeTab, setActiveTab] = useState('income');
  const [categories, setCategories] = useState({
    income: [],
    expenses: []
  });
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('bi-tag');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [selectedSubcategoryIcon, setSelectedSubcategoryIcon] = useState('bi-tag-fill');
  const [availableIcons, setAvailableIcons] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editSubcategoryName, setEditSubcategoryName] = useState('');
  const [editSubcategoryIcon, setEditSubcategoryIcon] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItemType, setDeleteItemType] = useState('');
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [deleteItemName, setDeleteItemName] = useState('');
  
  // Initialize data from Django
  useEffect(() => {
    if (window.availableIcons) {
      setAvailableIcons(window.availableIcons);
    }
    
    // Always use the API to fetch categories - more reliable
    fetchCategories();
  }, []);

  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ ...notification, show: false });
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification.show]);
  
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
  };
  
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/finances/api/categories/');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Validate the data structure
      if (!data.income || !data.expenses) {
        console.error('Invalid data structure - missing income or expenses arrays:', data);
        throw new Error('Invalid data structure received from API');
      }
      
      // Check if categories have subcategories property
      const incomeWithSubs = data.income.filter(cat => 
        cat.subcategories && Array.isArray(cat.subcategories)).length;
      const expensesWithSubs = data.expenses.filter(cat => 
        cat.subcategories && Array.isArray(cat.subcategories)).length;
      
      console.log(`Categories with subcategories: income=${incomeWithSubs}/${data.income.length}, expenses=${expensesWithSubs}/${data.expenses.length}`);
      
      // Log some sample data 
      if (data.income.length > 0) {
        console.log('Sample income category:', data.income[0]);
      }
      if (data.expenses.length > 0) {
        console.log('Sample expense category:', data.expenses[0]);
      }
      
      // Set categories from API response
      setCategories({
        income: data.income || [],
        expenses: data.expenses || []
      });
      
      // Debug info for subcategories
      setTimeout(() => {
        // Log subcategories after state update
        console.log('Categories state after update:');
        const incomeCats = [...categories.income];
        const expenseCats = [...categories.expenses];
        
        console.log(`Income categories: ${incomeCats.length}`);
        incomeCats.forEach(cat => {
          console.log(`  - ${cat.name}: ${cat.subcategories ? cat.subcategories.length : 0} subcategories`);
        });
        
        console.log(`Expense categories: ${expenseCats.length}`);
        expenseCats.forEach(cat => {
          console.log(`  - ${cat.name}: ${cat.subcategories ? cat.subcategories.length : 0} subcategories`);
        });
      }, 100);
      
      if (data.availableIcons && data.availableIcons.length > 0) {
        setAvailableIcons(data.availableIcons);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again later.');
      showNotification('Failed to load categories. Please try again.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }
    
    try {
      // Get the Django form
      const form = document.getElementById('django-category-form');
      if (!form) {
        throw new Error('Django form not found');
      }
      
      // Set values in the form
      const nameInput = form.querySelector('[name="name"]');
      const iconInput = form.querySelector('[name="icon"]');
      
      if (nameInput && iconInput) {
        nameInput.value = newCategoryName;
        iconInput.value = selectedIcon;
      } else {
        throw new Error('Form inputs not found');
      }
      
      // Create form data to submit
      const formData = new FormData(form);
      
      // Submit the form via AJAX
      const response = await fetch(form.action || '/finances/categories/', {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest', // This indicates an AJAX request
          'X-CSRFToken': window.csrfToken || form.querySelector('[name="csrfmiddlewaretoken"]').value,
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add category');
      }
      
      // Reset form and close modal
      setNewCategoryName('');
      setSelectedIcon('bi-tag');
      setShowAddModal(false);
      
      // Refresh categories to get the updated list
      await fetchCategories();
      showNotification(`Category "${data.category.name}" added successfully`);
    } catch (err) {
      console.error('Error adding category:', err);
      showNotification('Failed to add category. Please try again.', 'danger');
    }
  };

  const confirmDeleteCategory = (categoryId, e) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Find the category to be deleted
    const category = [...categories.income, ...categories.expenses].find(c => c.id === categoryId);
    
    if (category) {
      setDeleteItemType('category');
      setDeleteItemId(categoryId);
      setDeleteItemName(category.name);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!categoryId) {
      return;
    }
    
    try {
      // Get category name before deleting
      const category = [...categories.income, ...categories.expenses].find(c => c.id === categoryId);
      const categoryName = category ? category.name : 'Category';
      
      // Determine the list type
      const isIncome = category && (category.icon.includes('cash') || category.icon.includes('graph'));
      const listType = isIncome ? 'income' : 'expenses';
      
      // Immediately update UI to remove the category
      setCategories(prevCategories => ({
        ...prevCategories,
        [listType]: prevCategories[listType].filter(cat => cat.id !== categoryId)
      }));
      
      // Submit the delete request
      const response = await fetch(`/finances/api/categories/${categoryId}/delete/`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': window.csrfToken,
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        // If there's an error, refresh categories to restore correct state
        await fetchCategories();
        throw new Error(data.error || 'Failed to delete category');
      }
      
      // Close edit modal if we're deleting the currently selected category
      if (selectedCategory && selectedCategory.id === categoryId) {
        // Don't call closeEditModal() as it would call fetchCategories() again
        setSelectedCategory(null);
        setNewSubcategoryName('');
        setSelectedSubcategoryIcon('bi-tag-fill');
        setEditingSubcategory(null);
        setEditSubcategoryName('');
        setEditSubcategoryIcon('');
        setShowEditModal(false);
      }
      
      // Refresh categories in the background to ensure sync with server
      fetchCategories().catch(error => {
        console.error('Error refreshing categories:', error);
      });
      
      // Show success notification
      showNotification(`Category "${categoryName}" deleted successfully`);
    } catch (err) {
      console.error('Error deleting category:', err);
      showNotification('Failed to delete category. Please try again.', 'danger');
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategoryName.trim() || !selectedCategory) {
      return;
    }
    
    try {
      // Create form data to submit
      const formData = new FormData();
      formData.append('name', newSubcategoryName);
      formData.append('icon', selectedSubcategoryIcon);
      formData.append('parent_category', selectedCategory.id);
      formData.append('csrfmiddlewaretoken', window.csrfToken);
      
      // Submit the form via AJAX
      const response = await fetch(`/finances/api/categories/${selectedCategory.id}/subcategories/add/`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': window.csrfToken,
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add subcategory');
      }
      
      // Check if operation was successful
      if (data.success) {
        const newSubcategory = data.subcategory;
        
        // Auto-expand the category to show the new subcategory
        setExpandedCategories(prev => ({
          ...prev,
          [selectedCategory.id]: true
        }));
        
        // Reset form
        setNewSubcategoryName('');
        setSelectedSubcategoryIcon('bi-tag-fill');
        
        // Focus the input field for the next subcategory
        document.getElementById('subcategoryName')?.focus();
        
        // Refresh categories to include the new subcategory
        await fetchCategories();
        
        // Update the selected category with fresh data
        if (selectedCategory) {
          // Get updated category data
          const listType = selectedCategory.icon.includes('cash') || 
                          selectedCategory.icon.includes('graph') ? 'income' : 'expenses';
          
          // Find the updated category in our refreshed state
          const updatedCategories = await new Promise(resolve => {
            setTimeout(() => {
              const updatedCategory = categories[listType].find(c => c.id === selectedCategory.id);
              console.log('Updated selected category:', updatedCategory);
              resolve(updatedCategory || selectedCategory);
            }, 100);
          });
          
          // Update selected category
          setSelectedCategory(updatedCategories);
        }

        // Show success notification
        showNotification(`Subcategory "${newSubcategory.name}" added successfully`);
      }
    } catch (err) {
      console.error('Error adding subcategory:', err);
      showNotification('Failed to add subcategory. Please try again.', 'danger');
    }
  };

  const confirmDeleteSubcategory = (subcategoryId) => {
    if (!selectedCategory) {
      return;
    }
    
    // Find the subcategory to be deleted
    const subcategory = selectedCategory.subcategories.find(s => s.id === subcategoryId);
    
    if (subcategory) {
      setDeleteItemType('subcategory');
      setDeleteItemId(subcategoryId);
      setDeleteItemName(subcategory.name);
      setShowDeleteModal(true);
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!selectedCategory || !subcategoryId) {
      return;
    }
    
    try {
      // Get subcategory name before deleting
      const subcategory = selectedCategory.subcategories.find(s => s.id === subcategoryId);
      const subcategoryName = subcategory ? subcategory.name : 'Subcategory';
      
      // Submit the delete request
      const response = await fetch(`/finances/api/subcategories/${subcategoryId}/delete/`, {
        method: 'DELETE',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': window.csrfToken,
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete subcategory');
      }
      
      // Immediately update the selected category in the UI
      setSelectedCategory(prevCategory => {
        if (!prevCategory) return null;
        
        return {
          ...prevCategory,
          subcategories: prevCategory.subcategories.filter(sub => sub.id !== subcategoryId)
        };
      });
      
      // Refresh categories in the background to update the full UI
      fetchCategories().catch(error => {
        console.error('Error refreshing categories:', error);
      });
      
      // Show success notification
      showNotification(`Subcategory "${subcategoryName}" deleted successfully`);
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      showNotification('Failed to delete subcategory. Please try again.', 'danger');
    }
  };

  const startEditingSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory);
    setEditSubcategoryName(subcategory.name);
    setEditSubcategoryIcon(subcategory.icon);
  };

  const cancelEditingSubcategory = () => {
    setEditingSubcategory(null);
    setEditSubcategoryName('');
    setEditSubcategoryIcon('');
  };

  const handleUpdateSubcategory = async () => {
    if (!selectedCategory || !editingSubcategory || !editSubcategoryName.trim()) {
      return;
    }
    
    try {
      // Create form data to submit
      const formData = new FormData();
      formData.append('name', editSubcategoryName);
      formData.append('icon', editSubcategoryIcon);
      formData.append('csrfmiddlewaretoken', window.csrfToken);
      
      // Submit the form via AJAX
      const response = await fetch(`/finances/api/subcategories/${editingSubcategory.id}/update/`, {
        method: 'POST',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'X-CSRFToken': window.csrfToken,
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subcategory');
      }
      
      // Update the subcategory in our state
      if (data.success) {
        const updatedSubcategory = data.subcategory;
        
        // Refresh categories to update the UI
        await fetchCategories();
        
        // Update the selected category with fresh data
        if (selectedCategory) {
          // Get updated category data
          const listType = selectedCategory.icon.includes('cash') || 
                          selectedCategory.icon.includes('graph') ? 'income' : 'expenses';
          
          // Find the updated category in our refreshed state
          const updatedCategories = await new Promise(resolve => {
            setTimeout(() => {
              const updatedCategory = categories[listType].find(c => c.id === selectedCategory.id);
              resolve(updatedCategory || selectedCategory);
            }, 100);
          });
          
          // Update selected category
          setSelectedCategory(updatedCategories);
        }
        
        // Show success notification
        showNotification(`Subcategory "${updatedSubcategory.name}" updated successfully`);
        
        // Reset editing state
        cancelEditingSubcategory();
      }
    } catch (err) {
      console.error('Error updating subcategory:', err);
      showNotification('Failed to update subcategory. Please try again.', 'danger');
    }
  };

  const toggleCategoryExpand = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const openAddModal = () => {
    setNewCategoryName('');
    setSelectedIcon('bi-tag');
    setShowAddModal(true);
  };

  const openEditModal = (category, e) => {
    // Prevent triggering the list item click event when clicking on the edit button
    e.stopPropagation();
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const closeEditModal = async () => {
    try {
      // Refresh categories to ensure data is up to date
      console.log('Closing edit modal and refreshing categories...');
      await fetchCategories();
      console.log('Categories refreshed successfully');
    } catch (error) {
      console.error('Error refreshing categories:', error);
    } finally {
      // Reset state
      setSelectedCategory(null);
      setNewSubcategoryName('');
      setSelectedSubcategoryIcon('bi-tag-fill');
      setEditingSubcategory(null);
      setEditSubcategoryName('');
      setEditSubcategoryIcon('');
      setShowEditModal(false);
    }
  };

  const renderCategoryItem = (category, index, listType) => {
    // Check if subcategories exist and log for debugging
    const hasSubcategories = category.subcategories && Array.isArray(category.subcategories) && category.subcategories.length > 0;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Rendering category ${category.name} with subcategories:`, 
                 hasSubcategories ? category.subcategories.length : 'none');
    }
    
    const isExpanded = expandedCategories[category.id] || false;
    
    return (
      <React.Fragment key={category.id}>
        <li 
          className="list-group-item d-flex justify-content-between align-items-center category-item"
          onClick={() => hasSubcategories && toggleCategoryExpand(category.id)}
        >
          <div className="d-flex align-items-center">
            <div className="category-icon me-3">
              <i className={`bi ${category.icon}`} aria-hidden="true"></i>
            </div>
            <div>
              <span className="category-name">
                {category.name}
                {hasSubcategories && (
                  <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} ms-2 small`}></i>
                )}
              </span>
              {hasSubcategories && (
                <div className="small text-muted">
                  {category.subcategories.length} subcategories
                </div>
              )}
            </div>
          </div>
          <div className="btn-group">
            <button 
              className="btn btn-sm btn-outline-primary"
              onClick={(e) => openEditModal(category, e)}
            >
              <i className="bi bi-pencil" aria-hidden="true"></i> Edit
            </button>
            <button 
              className="btn btn-sm btn-outline-danger ms-2"
              onClick={(e) => {
                e.stopPropagation();
                confirmDeleteCategory(category.id, e);
              }}
            >
              <i className="bi bi-trash" aria-hidden="true"></i> Delete
            </button>
          </div>
        </li>
        
        {/* Subcategories dropdown */}
        {isExpanded && hasSubcategories && (
          <li className="list-group-item subcategories-container py-2">
            <ul className="list-group list-group-flush">
              {category.subcategories.map(subcategory => (
                <li key={subcategory.id} className="list-group-item py-2 subcategory-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center">
                      <div className="category-icon subcategory-icon me-2">
                        <i className={`bi ${subcategory.icon}`} aria-hidden="true"></i>
                      </div>
                      <span>{subcategory.name}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </li>
        )}
      </React.Fragment>
    );
  };

  return (
    <div className="container py-4">
      {/* Notification */}
      {notification.show && (
        <div className={`notification-toast alert alert-${notification.type}`} role="alert">
          {notification.message}
          <button 
            type="button" 
            className="btn-close ms-2" 
            onClick={() => setNotification({ ...notification, show: false })}
            aria-label="Close"
          ></button>
        </div>
      )}
      
      <header className="page-header mb-4">
        <h1 className="h2">Categories</h1>
        <p className="text-muted">Manage your transaction categories</p>
      </header>

      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h2 className="h4 mb-0">Categories Management</h2>
              <button 
                className="btn btn-primary btn-sm" 
                onClick={openAddModal}
              >
                <i className="bi bi-plus-lg" aria-hidden="true"></i> Add Category
              </button>
            </div>
            <div className="card-body">
              <ul className="nav nav-tabs mb-4" role="tablist">
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

              {isLoading ? (
                <div className="text-center p-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2">Loading categories...</p>
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
                        <p>No income categories found. Add your first category using the button above!</p>
                      </div>
                    ) : (
                      <ul className="list-group">
                        {categories.income.map((category, index) => renderCategoryItem(category, index, 'income'))}
                      </ul>
                    )}
                  </div>
                  <div className={`tab-pane fade ${activeTab === 'expenses' ? 'show active' : ''}`}>
                    {categories.expenses.length === 0 ? (
                      <div className="text-center p-4">
                        <p>No expense categories found. Add your first category using the button above!</p>
                      </div>
                    ) : (
                      <ul className="list-group">
                        {categories.expenses.map((category, index) => renderCategoryItem(category, index, 'expenses'))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="modal-backdrop show"></div>
      )}
      <div className={`modal fade ${showAddModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" aria-labelledby="addCategoryModalLabel" aria-hidden={!showAddModal}>
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="addCategoryModalLabel">Add New Category</h5>
              <button 
                type="button" 
                className="btn-close" 
                aria-label="Close"
                onClick={() => setShowAddModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="categoryName" className="form-label">Category Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="categoryName" 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Enter category name"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Category Type</label>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      name="categoryType" 
                      id="incomeType" 
                      checked={activeTab === 'income'}
                      onChange={() => setActiveTab('income')}
                    />
                    <label className="form-check-label" htmlFor="incomeType">
                      Income
                    </label>
                  </div>
                  <div className="form-check">
                    <input 
                      className="form-check-input" 
                      type="radio" 
                      name="categoryType" 
                      id="expenseType" 
                      checked={activeTab === 'expenses'}
                      onChange={() => setActiveTab('expenses')}
                    />
                    <label className="form-check-label" htmlFor="expenseType">
                      Expense
                    </label>
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label">Choose an Icon</label>
                  <div className="icon-selection">
                    {availableIcons.map(iconItem => (
                      <div 
                        key={iconItem.icon}
                        className={`icon-option ${selectedIcon === iconItem.icon ? 'selected' : ''}`}
                        onClick={() => setSelectedIcon(iconItem.icon)}
                        title={iconItem.name}
                      >
                        <i className={`bi ${iconItem.icon}`}></i>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {showEditModal && (
        <div className="modal-backdrop show"></div>
      )}
      <div className={`modal fade ${showEditModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" aria-labelledby="editCategoryModalLabel" aria-hidden={!showEditModal}>
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editCategoryModalLabel">
                Edit Category: {selectedCategory ? selectedCategory.name : ''}
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                aria-label="Close"
                onClick={closeEditModal}
              ></button>
            </div>
            <div className="modal-body">
              {selectedCategory && (
                <div className="row">
                  <div className="col-md-12 mb-4">
                    <h6 className="fw-bold mb-3">Subcategories</h6>
                    {selectedCategory.subcategories && selectedCategory.subcategories.length > 0 ? (
                      <ul className="list-group mb-3">
                        {selectedCategory.subcategories.map(sub => (
                          <li key={sub.id} className="list-group-item d-flex justify-content-between align-items-center">
                            {editingSubcategory && editingSubcategory.id === sub.id ? (
                              // Edit mode
                              <div className="w-100">
                                <div className="d-flex mb-2">
                                  <input 
                                    type="text" 
                                    className="form-control me-2" 
                                    value={editSubcategoryName} 
                                    onChange={(e) => setEditSubcategoryName(e.target.value)}
                                    placeholder="Enter subcategory name"
                                  />
                                </div>
                                <div className="icon-selection mb-2">
                                  {availableIcons.map(iconItem => (
                                    <div 
                                      key={iconItem.icon}
                                      className={`icon-option small ${editSubcategoryIcon === iconItem.icon ? 'selected' : ''}`}
                                      onClick={() => setEditSubcategoryIcon(iconItem.icon)}
                                      title={iconItem.name}
                                    >
                                      <i className={`bi ${iconItem.icon}`}></i>
                                    </div>
                                  ))}
                                </div>
                                <div className="d-flex">
                                  <button 
                                    className="btn btn-sm btn-success me-2"
                                    onClick={handleUpdateSubcategory}
                                    disabled={!editSubcategoryName.trim()}
                                  >
                                    <i className="bi bi-check" aria-hidden="true"></i> Save
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-secondary"
                                    onClick={cancelEditingSubcategory}
                                  >
                                    <i className="bi bi-x" aria-hidden="true"></i> Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              // View mode
                              <>
                                <div className="d-flex align-items-center">
                                  <div className="category-icon me-2">
                                    <i className={`bi ${sub.icon}`} aria-hidden="true"></i>
                                  </div>
                                  <span>{sub.name}</span>
                                </div>
                                <div>
                                  <button 
                                    className="btn btn-sm btn-outline-primary me-2"
                                    onClick={() => startEditingSubcategory(sub)}
                                  >
                                    <i className="bi bi-pencil" aria-hidden="true"></i> Edit
                                  </button>
                                  <button 
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => confirmDeleteSubcategory(sub.id)}
                                  >
                                    <i className="bi bi-trash" aria-hidden="true"></i>
                                  </button>
                                </div>
                              </>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-muted">No subcategories yet. Add one below.</p>
                    )}
                    
                    <hr/>
                    
                    <h6 className="fw-bold mb-3">Add Subcategory</h6>
                    <form className="row g-3">
                      <div className="col-md-6">
                        <label htmlFor="subcategoryName" className="form-label">Subcategory Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="subcategoryName" 
                          value={newSubcategoryName}
                          onChange={(e) => setNewSubcategoryName(e.target.value)}
                          placeholder="Enter subcategory name"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Icon</label>
                        <div className="icon-selection">
                          {availableIcons.map(iconItem => (
                            <div 
                              key={iconItem.icon}
                              className={`icon-option small ${selectedSubcategoryIcon === iconItem.icon ? 'selected' : ''}`}
                              onClick={() => setSelectedSubcategoryIcon(iconItem.icon)}
                              title={iconItem.name}
                            >
                              <i className={`bi ${iconItem.icon}`}></i>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="col-12">
                        <button 
                          type="button" 
                          className="btn btn-success btn-sm"
                          onClick={handleAddSubcategory}
                          disabled={!newSubcategoryName.trim()}
                        >
                          <i className="bi bi-plus-lg" aria-hidden="true"></i> Add Subcategory
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer d-flex justify-content-between">
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => confirmDeleteCategory(selectedCategory?.id)}
              >
                <i className="bi bi-trash" aria-hidden="true"></i> Delete Category
              </button>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={closeEditModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop show"></div>
      )}
      <div className={`modal fade ${showDeleteModal ? 'show d-block' : ''}`} tabIndex="-1" role="dialog" aria-labelledby="deleteConfirmationModalLabel" aria-hidden={!showDeleteModal}>
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteConfirmationModalLabel">
                Confirm Delete
              </h5>
              <button 
                type="button" 
                className="btn-close" 
                aria-label="Close"
                onClick={() => setShowDeleteModal(false)}
              ></button>
            </div>
            <div className="modal-body">
              <p>
                {deleteItemType === 'category' ? (
                  <>Are you sure you want to delete the category <strong>"{deleteItemName}"</strong>? This will also delete all its subcategories.</>
                ) : (
                  <>Are you sure you want to delete the subcategory <strong>"{deleteItemName}"</strong>?</>
                )}
              </p>
              <div className="alert alert-warning">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                This action cannot be undone.
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                onClick={() => {
                  if (deleteItemType === 'category') {
                    handleDeleteCategory(deleteItemId);
                  } else {
                    handleDeleteSubcategory(deleteItemId);
                  }
                  setShowDeleteModal(false);
                }}
              >
                Delete {deleteItemType === 'category' ? 'Category' : 'Subcategory'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories; 