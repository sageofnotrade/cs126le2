/**
 * Transaction handling functionality
 * 
 * This script handles the transaction form interactions including
 * the "Add Income" and "Add Expense" buttons.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Button handlers for add income/expense
    const addIncomeBtn = document.getElementById('add-income-btn');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', function() {
            openTransactionModal('income');
        });
    }
    
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function() {
            openTransactionModal('expense');
        });
    }
    
    // Save transaction button handler
    const saveTransactionBtn = document.getElementById('save-transaction-btn');
    if (saveTransactionBtn) {
        saveTransactionBtn.addEventListener('click', function() {
            saveTransaction();
        });
    }
    
    // Initialize the date and time fields with current values when modal opens
    const transactionModal = document.getElementById('transactionModal');
    if (transactionModal) {
        transactionModal.addEventListener('show.bs.modal', function() {
            // Set default date and time to now
            const now = new Date();
            document.getElementById('transaction-date').value = formatDateForInput(now);
            document.getElementById('transaction-time').value = formatTimeForInput(now);
        });
        
        // Don't clear selection when modal is hidden - selection persists until save
        
        // Add a listener to handle subcategory selections in the form
        transactionModal.addEventListener('click', function(event) {
            console.log('Modal click event', event.target);
            // Listen for clicks on the hierarchical list container
            const hierarchicalList = transactionModal.querySelector('.hierarchical-category-list');
            if (hierarchicalList && hierarchicalList.contains(event.target)) {
                console.log('Click in hierarchical list');
                
                // Handle clicking on a subcategory item
                const subcategoryItem = event.target.closest('.subcategory-item');
                if (subcategoryItem) {
                    const categoryId = subcategoryItem.getAttribute('data-category-id');
                    const subcategoryId = subcategoryItem.getAttribute('data-subcategory-id');
                    
                    console.log('Subcategory clicked:', categoryId, subcategoryId);
                    handleCategorySelection(categoryId, subcategoryId);
                }
                
                // Handle clicking on a category header
                const categoryHeader = event.target.closest('.category-header');
                if (categoryHeader) {
                    const categoryItem = categoryHeader.closest('.category-item');
                    const categoryId = categoryItem.getAttribute('data-category-id');
                    
                    console.log('Category clicked:', categoryId);
                    handleCategorySelection(categoryId, '');
                }
            }
        });
    }
    
    // Add an event listener for the transaction category select
    const categorySelect = document.getElementById('transaction-category');
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            const categoryId = this.value;
            if (categoryId) {
                loadSubcategories(categoryId);
            }
            validateField(this);
        });
    }
    
    // Add validation event listeners to form fields
    setupFormValidation();
});

// Set up form validation event listeners
function setupFormValidation() {
    // Get form elements
    const form = document.getElementById('transaction-form');
    if (!form) return;
    
    // Add validation on input for all required fields
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            validateField(this);
        });
        
        input.addEventListener('blur', function() {
            validateField(this);
        });
    });
    
    // Special validation for the amount field
    const amountField = document.getElementById('transaction-amount');
    if (amountField) {
        amountField.addEventListener('input', function() {
            // Check if amount is a positive number
            const amount = parseFloat(this.value);
            if (isNaN(amount) || amount <= 0) {
                this.setCustomValidity('Amount must be greater than 0');
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
                
                // Show feedback message
                const feedback = this.parentNode.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.textContent = 'Please enter a valid amount greater than 0.';
                    feedback.classList.add('d-block');
                }
            } else {
                this.setCustomValidity('');
                this.classList.remove('is-invalid');
                this.classList.add('is-valid');
                
                // Hide feedback message
                const feedback = this.parentNode.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.classList.remove('d-block');
                }
            }
        });
    }
}

// Validate a single form field
function validateField(field) {
    // Skip validation for non-required fields
    if (!field.hasAttribute('required')) return;
    
    // Get the feedback element - it might be in the parent node or parent's parent (for input groups)
    let feedbackElement = field.parentNode.querySelector('.invalid-feedback');
    if (!feedbackElement && field.parentNode.parentNode) {
        feedbackElement = field.parentNode.parentNode.querySelector('.invalid-feedback');
    }
    
    if (field.checkValidity()) {
        field.classList.remove('is-invalid');
        field.classList.add('is-valid');
        
        // Hide feedback
        if (feedbackElement) {
            feedbackElement.classList.remove('d-block');
        }
    } else {
        field.classList.remove('is-valid');
        field.classList.add('is-invalid');
        
        // Show feedback
        if (feedbackElement) {
            feedbackElement.classList.add('d-block');
        }
    }
}

function openTransactionModal(type, existingTransaction = null) {
    console.log('openTransactionModal called with type:', type, 'and transaction:', existingTransaction);
    
    // Special handling for edit operations
    const isEdit = existingTransaction && existingTransaction.id;
    
    // Reset form - but be careful with the transaction ID
    const form = document.getElementById('transaction-form');
    form.reset();
    form.classList.remove('was-validated');
    
    // Reset validation states
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
        
        // Reset feedback messages
        const feedback = input.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.classList.remove('d-block');
        }
    });
    
    // Don't reset the ID field immediately if this is an edit operation
    if (!isEdit) {
        document.getElementById('transaction-id').value = '';
    }
    
    document.getElementById('transaction-type').value = type;
    
    // Set default date and time to now
    const now = new Date();
    document.getElementById('transaction-date').value = formatDateForInput(now);
    document.getElementById('transaction-time').value = formatTimeForInput(now);
    
    // If editing an existing transaction, populate the form
    if (existingTransaction) {
        console.log('Populating form with existing transaction data, ID:', existingTransaction.id);
        
        // Explicitly check for ID and log warnings if missing
        if (existingTransaction.id === undefined || existingTransaction.id === null) {
            console.warn('Transaction ID is missing in the existing transaction data!');
        } else if (existingTransaction.id === '') {
            console.warn('Transaction ID is empty string - this will create a new transaction instead of updating!');
        }
        
        // IMPORTANT: Set the ID field first before other operations that might trigger form events
        document.getElementById('transaction-id').value = existingTransaction.id || '';
        
        document.getElementById('transaction-title').value = existingTransaction.title || '';
        document.getElementById('transaction-amount').value = existingTransaction.amount || '';
        
        // Set date and time if available
        if (existingTransaction.date) {
            document.getElementById('transaction-date').value = existingTransaction.date.split('T')[0];
            
            if (existingTransaction.time) {
                document.getElementById('transaction-time').value = existingTransaction.time;
            }
        }
        
        // Set category and subcategory
        if (existingTransaction.category) {
            document.getElementById('transaction-category').value = existingTransaction.category;
            
            if (existingTransaction.subcategory) {
                document.getElementById('transaction-subcategory').value = existingTransaction.subcategory;
            }
        }
        
        // Set account
        if (existingTransaction.transaction_account) {
            document.getElementById('transaction-account').value = existingTransaction.transaction_account;
        }
        
        // Set notes
        if (existingTransaction.notes) {
            document.getElementById('transaction-notes').value = existingTransaction.notes;
        }
        
        // Update modal title based on transaction type
        const modalTitle = existingTransaction.type === 'income' ? 'Edit Income' : 'Edit Expense';
        document.getElementById('transactionModalLabel').textContent = modalTitle;
        
        // Log the state of the form after population
        console.log('Form populated with ID:', document.getElementById('transaction-id').value);
        
        // Validate filled fields
        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        inputs.forEach(input => {
            validateField(input);
        });
    } else {
        // Update modal title based on transaction type for new transactions
        const modalTitle = type === 'income' ? 'Add Income' : 'Add Expense';
        document.getElementById('transactionModalLabel').textContent = modalTitle;
    }
    
    // First fetch accounts to check if any exist
    checkAndUpdateAccountsDropdown(type);
    
    // Filter categories based on transaction type
    filterCategoriesByTransactionType(type);
    
    // Show the modal using either Bootstrap or a manual fallback
    const transactionModal = document.getElementById('transactionModal');
    
    try {
        // Attempt to use Bootstrap's modal
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(transactionModal);
            modal.show();
            console.log('Modal shown using Bootstrap Modal');
        } else {
            // Fallback to manual DOM manipulation
            showModalManually(transactionModal);
            console.log('Modal shown using manual DOM manipulation');
        }
    } catch (error) {
        console.error('Error showing modal:', error);
        // Fallback to manual DOM manipulation
        showModalManually(transactionModal);
    }
    
    // Once the modal is shown, create/refresh the hierarchical category list
    // The setTimeout is needed to ensure the modal is fully shown before updating the list
    setTimeout(() => {
        if (window.createHierarchicalCategoryList) {
            const categorySelect = document.getElementById('transaction-category');
            const subcategoryField = document.getElementById('transaction-subcategory');
            window.createHierarchicalCategoryList(categorySelect, subcategoryField);
        }
        
        // Double-check that the ID is still set correctly after modal is fully shown
        if (existingTransaction && existingTransaction.id) {
            const idField = document.getElementById('transaction-id');
            console.log('Re-checking transaction ID field value:', idField.value);
            
            if (idField.value !== existingTransaction.id) {
                console.warn('ID field value changed after modal shown! Fixing...');
                idField.value = existingTransaction.id;
            }
        }
    }, 250);
}

// Function to manually show a modal without using Bootstrap
function showModalManually(modalElement) {
    if (!modalElement) {
        console.error('Modal element not found');
        return;
    }
    
    // First remove any existing backdrops to prevent stacking
    const existingBackdrops = document.querySelectorAll('.modal-backdrop');
    existingBackdrops.forEach(backdrop => backdrop.remove());
    
    // Show the modal
    modalElement.style.display = 'block';
    modalElement.classList.add('show');
    
    // Create and add the backdrop
    const backdrop = document.createElement('div');
    backdrop.classList.add('modal-backdrop', 'show');
    document.body.appendChild(backdrop);
    
    // Add the modal-open class to the body
    document.body.classList.add('modal-open');
    
    // Set up event listeners to close the modal
    const closeButtons = modalElement.querySelectorAll('[data-bs-dismiss="modal"]');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => hideModalManually(modalElement));
    });
    
    // Close when clicking outside the modal content
    modalElement.addEventListener('click', function(event) {
        if (event.target === modalElement) {
            hideModalManually(modalElement);
        }
    });
}

// Function to manually hide a modal without using Bootstrap
function hideModalManually(modalElement) {
    if (!modalElement) return;
    
    // Hide the modal
    modalElement.style.display = 'none';
    modalElement.classList.remove('show');
    
    // Remove the backdrop
    const backdrop = document.querySelector('.modal-backdrop');
    if (backdrop) backdrop.remove();
    
    // Remove the modal-open class from the body
    document.body.classList.remove('modal-open');
}

function saveTransaction() {
    // Get the form
    const form = document.getElementById('transaction-form');
    
    // Validate all fields
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        validateField(input);
        if (!input.checkValidity()) {
            isValid = false;
        }
    });
    
    // Check form validity
    if (!isValid) {
        // Add the was-validated class to show all validation messages
        form.classList.add('was-validated');
        
        // Show an error toast
        if (typeof showToast === 'function') {
            showToast('Validation Error', 'Please fill in all required fields correctly.', 'danger');
        }
        
        // Focus the first invalid field
        const firstInvalid = form.querySelector('.is-invalid');
        if (firstInvalid) {
            firstInvalid.focus();
        }
        
        return;
    }
    
    // If we're here, the form is valid
    
    // Extract the form values
    const formData = new FormData(form);
    const transactionId = document.getElementById('transaction-id').value;
    
    // Determine if this is an edit or a new transaction
    const isEdit = transactionId && transactionId !== '';
    
    // Disable the save button to prevent multiple submissions
    const saveButton = document.getElementById('save-transaction-btn');
    saveButton.disabled = true;
    saveButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
    
    // Determine the endpoint URL
    const url = isEdit 
        ? `/finances/transactions/api/${transactionId}/update/` 
        : '/finances/transactions/api/create/';
    
    // Get CSRF token 
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
    
    console.log('Saving transaction - Is Edit:', isEdit, 'ID:', transactionId);
    
    // Submit the form via AJAX
    fetch(url, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': csrfToken
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Handle the response from the server
        if (data.success) {
            console.log('Transaction saved successfully');
            
            // Hide the modal
            try {
            const transactionModal = document.getElementById('transactionModal');
                const bsModal = bootstrap.Modal.getInstance(transactionModal);
                if (bsModal) {
                    bsModal.hide();
                } else {
                    hideModalManually(transactionModal);
                }
            } catch (error) {
                console.error('Error hiding modal:', error);
            }
            
            // Show success message
            if (typeof showToast === 'function') {
                showToast(
                    isEdit ? 'Transaction Updated' : 'Transaction Created',
                    isEdit ? 'Your transaction was updated successfully!' : 'Your transaction was created successfully!',
                    'success'
                );
            }
            
            // Refresh the transaction list
            if (typeof loadTransactions === 'function') {
                setTimeout(() => {
                    loadTransactions();
                }, 500);
            } else {
                // If loadTransactions isn't available, reload the page
                window.location.reload();
            }
        } else {
            // Handle validation errors from the server
            console.error('Server validation errors:', data.errors);
            
            if (data.errors) {
                // Show the first error in a toast
                if (typeof showToast === 'function') {
                    const errorMessage = typeof data.errors === 'string' 
                        ? data.errors 
                        : Object.values(data.errors)[0];
                    showToast('Error', errorMessage, 'danger');
                }
                
                // If specific field errors are provided, mark the fields as invalid
                if (typeof data.errors === 'object') {
                    for (const field in data.errors) {
                        const inputField = document.getElementById(`transaction-${field}`);
                        if (inputField) {
                            inputField.classList.add('is-invalid');
                            inputField.classList.remove('is-valid');
                            
                            // Get feedback element
                            const feedbackElement = inputField.parentNode.querySelector('.invalid-feedback');
                            if (feedbackElement) {
                                feedbackElement.textContent = data.errors[field];
                                feedbackElement.classList.add('d-block');
                            }
                            
                            // Focus the first invalid field
                            if (field === Object.keys(data.errors)[0]) {
                                inputField.focus();
                            }
                        }
                    }
                }
            } else {
                if (typeof showToast === 'function') {
                    showToast('Error', 'There was a problem saving your transaction. Please try again.', 'danger');
                }
            }
        }
    })
    .catch(error => {
        console.error('Error saving transaction:', error);
        
        if (typeof showToast === 'function') {
            showToast('Error', 'Failed to save transaction: ' + error.message, 'danger');
        }
    })
    .finally(() => {
        // Re-enable the save button
        saveButton.disabled = false;
        saveButton.innerHTML = 'Save';
    });
}

/**
 * Show a toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - Toast type (success, danger, warning, info)
 */
function showToast(title, message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        toastContainer.style.zIndex = '1070';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div class="toast bg-${type === 'danger' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'} text-white" 
             role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
            <div class="toast-header bg-${type === 'danger' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'primary'} text-white">
                <i class="bi bi-${type === 'danger' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                <strong class="me-auto">${title}</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;
    
    // Add toast to container
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Get the toast element
    const toastElement = document.getElementById(toastId);
    
    // Apply initial styling
    toastElement.style.opacity = '0';
    toastElement.style.transform = 'translateY(20px)';
    toastElement.style.transition = 'all 0.3s ease';
    
    // Initialize the toast with Bootstrap if available
    let toast;
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
            toast = new bootstrap.Toast(toastElement, { 
                autohide: true, 
                delay: 5000 
            });
    toast.show();
        } else {
            // Fallback to manual handling
            showToastManually(toastElement);
        }
    } catch (error) {
        console.error('Error showing toast with Bootstrap:', error);
        // Fallback to manual handling
        showToastManually(toastElement);
    }
    
    // Animate in
    setTimeout(() => {
        toastElement.style.opacity = '1';
        toastElement.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
    
    // Also set a manual timeout as a fallback
    setTimeout(() => {
        // Check if the toast is still in the DOM
        if (document.getElementById(toastId)) {
            toastElement.style.opacity = '0';
            toastElement.style.transform = 'translateY(20px)';
            
            // Remove after fade out
            setTimeout(() => {
                if (document.getElementById(toastId)) {
                    toastElement.remove();
                }
            }, 300);
        }
    }, 5300);
    
    return toastElement;
}

// Function to manually show a toast if Bootstrap is not available
function showToastManually(toastElement) {
    // Show the toast
    toastElement.classList.add('show');
    
    // Set a timeout to hide the toast
    setTimeout(() => {
        // Fade out
        toastElement.style.opacity = '0';
        toastElement.style.transform = 'translateY(20px)';
        
        // Remove after fade out
        setTimeout(() => {
            toastElement.remove();
        }, 300);
    }, 5000);
}

function filterAccountsByTransactionType(type) {
    // Only show relevant accounts based on transaction type
    // For example, don't show credit accounts for income transactions
    const accountSelect = document.getElementById('transaction-account');
    const options = accountSelect.querySelectorAll('option');
    
    options.forEach(option => {
        const accountType = option.getAttribute('data-account-type');
        const isAddAccountOption = option.getAttribute('data-action') === 'add-account';
        
        if (isAddAccountOption) return; // Always show the add account option
        if (!accountType || option.value === '') return; // Skip the placeholder option
        
        if (type === 'income' && accountType === 'credit') {
            option.style.display = 'none';
        } else {
            option.style.display = '';
        }
    });
}

function filterCategoriesByTransactionType(type) {
    // Get all categories and show only the ones matching this transaction type
    const categorySelect = document.getElementById('transaction-category');
    const options = categorySelect.querySelectorAll('option');
    
    options.forEach(option => {
        const categoryType = option.getAttribute('data-type');
        if (!categoryType || option.value === '') return; // Skip the placeholder option
        
        if (categoryType && categoryType !== type) {
            option.style.display = 'none';
        } else {
            option.style.display = '';
        }
    });
    
    // Reset subcategory field
    document.getElementById('transaction-subcategory').value = '';
    
    // Also trigger our category dropdown/list to refresh with the current type filter
    setTimeout(() => {
        if (window.createHierarchicalCategoryList) {
            const subcategoryField = document.getElementById('transaction-subcategory');
            window.createHierarchicalCategoryList(categorySelect, subcategoryField);
        }
    }, 100);
}

// This function is called when a user explicitly selects a category from the dropdown
function handleCategorySelection(categoryId, subcategoryId = '') {
    console.log(`Category selected: ${categoryId}, Subcategory: ${subcategoryId}`);
    
    // Update the hidden fields
    document.getElementById('transaction-category').value = categoryId;
    document.getElementById('transaction-subcategory').value = subcategoryId;
    
    // Update the visual selection in the hierarchical list
    const listContainer = document.querySelector('.hierarchical-category-list');
    if (listContainer) {
        // Remember the current scroll position
        const scrollTop = listContainer.scrollTop;
        
        // Clear all existing selections
        listContainer.querySelectorAll('.category-item.selected, .subcategory-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Mark the appropriate item as selected
        if (subcategoryId) {
            // Select a subcategory item
            const subcategoryItem = listContainer.querySelector(`.subcategory-item[data-category-id="${categoryId}"][data-subcategory-id="${subcategoryId}"]`);
            if (subcategoryItem) {
                subcategoryItem.classList.add('selected');
                
                // Make sure parent category is expanded
                const categoryItem = subcategoryItem.closest('.category-item');
                if (categoryItem) {
                    categoryItem.classList.add('expanded');
                    
                    // Update chevron icon
                    const toggleIcon = categoryItem.querySelector('.category-toggle');
                    if (toggleIcon) {
                        toggleIcon.classList.remove('bi-chevron-right');
                        toggleIcon.classList.add('bi-chevron-down');
                    }
                }
            }
        } else {
            // Select a category item
            const categoryItem = listContainer.querySelector(`.category-item[data-category-id="${categoryId}"]`);
            if (categoryItem) {
                categoryItem.classList.add('selected');
            }
        }
        
        // Restore the scroll position
        setTimeout(() => {
            listContainer.scrollTop = scrollTop;
        }, 0);
    }
    
    console.log('Selection updated successfully');
}

function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatTimeForInput(date) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Function to load subcategories for a category
function loadSubcategories(categoryId) {
    console.log(`Loading subcategories for category ID: ${categoryId}`);
    
    fetch(`/finances/api/categories/${categoryId}/subcategories/`)
        .then(response => response.json())
        .then(subcategories => {
            console.log('Loaded subcategories:', subcategories);
            
            // Get the original select element
            const categorySelect = document.getElementById('transaction-category');
            
            // Remove existing subcategory options (if any)
            const options = Array.from(categorySelect.options);
            options.forEach(option => {
                if (option.getAttribute('data-parent-category') === categoryId) {
                    categorySelect.removeChild(option);
                }
            });
            
            // Find the selected category option to get its attributes
            const categoryOption = options.find(opt => opt.value === categoryId && opt.getAttribute('data-is-category') === 'true');
            if (!categoryOption) return;
            
            const categoryType = categoryOption.getAttribute('data-type');
            const categoryName = categoryOption.textContent;
            
            // Add the category itself as the first subcategory option
            const categorySubOption = document.createElement('option');
            categorySubOption.value = categoryId;
            categorySubOption.textContent = categoryName;
            categorySubOption.setAttribute('data-parent-category', categoryId);
            categorySubOption.setAttribute('data-type', categoryType);
            categorySubOption.setAttribute('data-icon', categoryOption.getAttribute('data-icon') || 'bi-tag');
            categorySubOption.setAttribute('data-subcategory-id', '');
            
            // Add new options for the subcategories after the category option
            let insertAfter = categoryOption;
            categorySelect.insertBefore(categorySubOption, insertAfter.nextSibling);
            insertAfter = categorySubOption;
            
            // Add the subcategories
            subcategories.forEach(sub => {
                const option = document.createElement('option');
                option.value = categoryId; // The value is still the category ID
                option.textContent = sub.name;
                option.setAttribute('data-parent-category', categoryId);
                option.setAttribute('data-subcategory-id', sub.id);
                option.setAttribute('data-type', categoryType);
                option.setAttribute('data-icon', sub.icon || 'bi-tag-fill');
                
                categorySelect.insertBefore(option, insertAfter.nextSibling);
                insertAfter = option;
            });
            
            // Refresh the hierarchical list
            if (window.createHierarchicalCategoryList) {
                const subcategoryField = document.getElementById('transaction-subcategory');
                window.createHierarchicalCategoryList(categorySelect, subcategoryField);
            }
        })
        .catch(error => {
            console.error('Error loading subcategories:', error);
        });
}

// Function to clear category selection (only called after successful save)
function clearCategorySelection() {
    const listContainer = document.querySelector('.hierarchical-category-list');
    if (listContainer) {
        listContainer.querySelectorAll('.category-item.selected, .subcategory-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
    }
}

// Function to check if accounts exist and update the dropdown accordingly
function checkAndUpdateAccountsDropdown(transactionType, forceRefresh = false) {
    console.log(`Checking accounts for transaction type: ${transactionType}, force refresh: ${forceRefresh}`);
    
    // Get the account select element
    const accountSelect = document.getElementById('transaction-account');
    if (!accountSelect) return;
    
    // Add a cache-busting parameter if forceRefresh is true
    const cacheBuster = forceRefresh ? `&_=${Date.now()}` : '';
    
    // Fetch accounts from the API with transaction type
    fetch(`/finances/api/accounts/?transaction_type=${transactionType}${cacheBuster}`)
        .then(response => response.json())
        .then(accounts => {
            console.log('Fetched accounts:', accounts);
            
            // Clear existing options except the placeholder
            while (accountSelect.options.length > 1) {
                accountSelect.remove(1);
            }
            
            // Filter accounts based on transaction type
            // For income transactions, exclude credit accounts
            if (transactionType === 'income') {
                accounts = accounts.filter(account => account.type !== 'credit');
            }
            
            // Check if there are any accounts after filtering
            if (accounts.length === 0) {
                console.log('No accounts found for transaction type ' + transactionType + ', adding the "Add Account" option');
                
                // Add the "Add Account" option
                const addAccountOption = document.createElement('option');
                addAccountOption.value = "add_account";
                addAccountOption.textContent = "➕ Add New Account";
                addAccountOption.setAttribute('data-icon', 'bi-plus-circle');
                addAccountOption.setAttribute('data-action', 'add-account');
                accountSelect.appendChild(addAccountOption);
                
                // Add event listener to detect when this option is selected
                accountSelect.addEventListener('change', handleAccountSelectionChange);
            } else {
                // Remove any change event listeners to avoid duplication
                const newAccountSelect = accountSelect.cloneNode(true);
                accountSelect.parentNode.replaceChild(newAccountSelect, accountSelect);
                
                // Re-add event listeners for the new select
                newAccountSelect.addEventListener('change', function(e) {
                    validateField(this);
                    handleAccountChange(e);
                });
                
                // Populate dropdown with accounts
                accounts.forEach(account => {
                    const option = document.createElement('option');
                    option.value = account.id;
                    option.textContent = account.name;
                    option.setAttribute('data-account-type', account.type);
                    option.setAttribute('data-balance', account.balance);
                    
                    // Store account details for validation with better handling of maintaining balance
                    if (account.type === 'debit') {
                        // Make sure maintaining_balance is explicitly set to 0 if it's undefined or null
                        option.setAttribute('data-maintaining-balance', account.maintaining_balance !== undefined && account.maintaining_balance !== null ? 
                            account.maintaining_balance : 0);
                    } else if (account.type === 'credit') {
                        option.setAttribute('data-credit-limit', account.credit_limit);
                        option.setAttribute('data-current-usage', account.current_usage || 0);
                    }
                    
                    // Set appropriate icon based on account type
                    let icon = 'bi-bank';
                    if (account.type === 'credit') {
                        icon = 'bi-credit-card';
                    } else if (account.type === 'wallet') {
                        icon = 'bi-wallet2';
                    } else if (account.type === 'debit') {
                        icon = 'bi-piggy-bank';
                    }
                    option.setAttribute('data-icon', icon);
                    
                    newAccountSelect.appendChild(option);
                });
                
                // Select the first account option by default
                if (newAccountSelect.options.length > 1) {
                    newAccountSelect.selectedIndex = 1;
                    
                    // Initialize the amount validation with the selected account
                    setTimeout(() => {
                        const event = new Event('change');
                        newAccountSelect.dispatchEvent(event);
                    }, 100);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching accounts:', error);
            // Show error message to user
            if (typeof showToast === 'function') {
                showToast('Error', 'Failed to load accounts. Please try again.', 'danger');
            }
        });
}

// Handle account selection change
function handleAccountSelectionChange(event) {
    const selectedValue = event.target.value;
    
    if (selectedValue === 'add_account') {
        console.log('Add Account option selected');
        
        // Reset the selection to the placeholder
        event.target.value = '';
        
        // Open the account modal
        openAccountModal();
    }
}

// Handle account change for amount validation
function handleAccountChange(event) {
    const accountSelect = event.target;
    const selectedOption = accountSelect.options[accountSelect.selectedIndex];
    
    if (!selectedOption || selectedOption.value === '' || selectedOption.value === 'add_account') {
        return;
    }
    
    const accountType = selectedOption.getAttribute('data-account-type');
    const transactionType = document.getElementById('transaction-type').value;
    const amountField = document.getElementById('transaction-amount');
    
    // Store account details for validation
    window.currentAccountDetails = {
        id: selectedOption.value,
        type: accountType,
        balance: parseFloat(selectedOption.getAttribute('data-balance') || 0),
        maintainingBalance: selectedOption.hasAttribute('data-maintaining-balance') ? 
            parseFloat(selectedOption.getAttribute('data-maintaining-balance')) : 0,
        creditLimit: parseFloat(selectedOption.getAttribute('data-credit-limit') || 0),
        currentUsage: parseFloat(selectedOption.getAttribute('data-current-usage') || 0)
    };
    
    // Add debug logging to help identify issues
    console.log('Raw maintaining balance attribute:', selectedOption.getAttribute('data-maintaining-balance'));
    console.log('Current account details:', window.currentAccountDetails);
    
    // Add custom validation for the amount field
    if (amountField) {
        // Clear previous custom validation message
        amountField.setCustomValidity('');
        
        // Remove previous event listener (if any)
        amountField.removeEventListener('input', validateAmountForAccountType);
        
        // Set up the input event to validate as user types
        amountField.addEventListener('input', validateAmountForAccountType);
        
        // Trigger validation if there's already a value
        if (amountField.value) {
            validateAmountForAccountType.call(amountField);
        }
    }
}

// Validate the amount based on account type
function validateAmountForAccountType() {
    if (!window.currentAccountDetails) {
        return true;
    }
    
    const amount = parseFloat(this.value);
    if (isNaN(amount) || amount <= 0) {
        this.setCustomValidity('Amount must be greater than 0');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
        
        // Show feedback message
        updateAmountFeedbackMessage(this, 'Amount must be greater than 0.');
        return false;
    }
    
    const transactionType = document.getElementById('transaction-type').value;
    const { type, balance, maintainingBalance, creditLimit, currentUsage } = window.currentAccountDetails;
    
    console.log('Validating amount:', amount, 'for account type:', type);
    console.log('Account details - balance:', balance, 'maintaining balance:', maintainingBalance);
    
    if (transactionType === 'expense') {
        // Check account-specific limitations for expenses
        if (type === 'debit') {
            // First check if balance is already below maintaining balance
            if (balance <= maintainingBalance) {
                // Balance is already below or equal to maintaining balance, block any withdrawal
                const message = `Cannot withdraw from this account. Current balance ($${balance.toFixed(2)}) is below the minimum required amount ($${maintainingBalance.toFixed(2)}).`;
                this.setCustomValidity(message);
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
                updateAmountFeedbackMessage(this, message);
                return false;
            }
            
            // Otherwise, ensure withdrawal doesn't drop below maintaining balance
            const availableForWithdrawal = balance - maintainingBalance;
            if (amount > availableForWithdrawal) {
                const message = `Amount exceeds available balance. Maximum withdrawal: $${availableForWithdrawal.toFixed(2)} to maintain minimum required amount of $${maintainingBalance.toFixed(2)}.`;
                this.setCustomValidity(message);
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
                updateAmountFeedbackMessage(this, message);
                return false;
            }
        } else if (type === 'credit') {
            // Ensure credit amount doesn't exceed available credit
            const availableCredit = creditLimit - currentUsage;
            if (amount > availableCredit) {
                const message = `Amount exceeds available credit. Maximum: $${availableCredit.toFixed(2)}`;
                this.setCustomValidity(message);
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
                updateAmountFeedbackMessage(this, message);
                return false;
            }
        } else if (type === 'wallet') {
            // Ensure wallet expense doesn't exceed balance
            if (amount > balance) {
                const message = `Amount exceeds wallet balance. Maximum: $${balance.toFixed(2)}`;
                this.setCustomValidity(message);
                this.classList.add('is-invalid');
                this.classList.remove('is-valid');
                updateAmountFeedbackMessage(this, message);
                return false;
            }
        }
    }
    
    // All validations passed
    this.setCustomValidity('');
    this.classList.remove('is-invalid');
    this.classList.add('is-valid');
    
    // Clear any feedback message
    updateAmountFeedbackMessage(this, '');
    return true;
}

// Update feedback message for amount field
function updateAmountFeedbackMessage(field, message) {
    // Find the feedback element - it might be in the parent node or parent's parent (for input groups)
    let feedbackElement = field.parentNode.querySelector('.invalid-feedback');
    if (!feedbackElement && field.parentNode.parentNode) {
        feedbackElement = field.parentNode.parentNode.querySelector('.invalid-feedback');
    }
    
    if (feedbackElement) {
        feedbackElement.textContent = message;
        if (message) {
            feedbackElement.classList.add('d-block');
        } else {
            feedbackElement.classList.remove('d-block');
        }
    }
}

// Function to open the account modal
function openAccountModal() {
    console.log('Opening account modal');
    
    // Store reference to the current transaction modal
    const transactionModal = document.getElementById('transactionModal');
    let transactionModalInstance = null;
    
    // Hide the transaction modal temporarily
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            transactionModalInstance = bootstrap.Modal.getInstance(transactionModal);
            if (transactionModalInstance) {
                transactionModalInstance.hide();
            }
        } else {
            hideModalManually(transactionModal);
        }
    } catch (error) {
        console.error('Error hiding transaction modal:', error);
    }
    
    // Check if the account modal already exists, if not, create it
    let accountModal = document.getElementById('addAccountModal');
    
    if (!accountModal) {
        // Create a new modal if it doesn't exist
        console.log('Account modal does not exist, creating it');
        
        // Create the modal HTML
        const modalHTML = `
        <div class="modal fade" id="addAccountModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">New Account</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="add-account-form" method="post">
                            <input type="hidden" name="csrfmiddlewaretoken" value="${document.querySelector('[name=csrfmiddlewaretoken]').value}">
                            <div class="mb-3">
                                <label>Name:</label>
                                <input type="text" class="form-control" name="name" required>
                            </div>
                            <div class="mb-3">
                                <label>Description:</label>
                                <input type="text" class="form-control" name="description">
                            </div>

                            <input type="hidden" id="id_account_type" name="account_type" value="Debit">

                            <ul class="nav nav-tabs" id="accountTab">
                                <li class="nav-item">
                                    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#debit" type="button">Debit</button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#credit" type="button">Credit</button>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#wallet" type="button">Wallet</button>
                                </li>
                            </ul>

                            <div class="tab-content pt-3">
                                <div class="tab-pane fade show active" id="debit">
                                    <div class="mb-3">
                                        <label>Balance:</label>
                                        <input type="number" step="0.01" class="form-control" name="balance" required>
                                    </div>
                                    <div class="mb-3">
                                        <label>Maintaining Balance:</label>
                                        <input type="number" step="0.01" class="form-control" name="maintaining_balance">
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="credit">
                                    <div class="mb-3">
                                        <label>Current Usage:</label>
                                        <input type="number" step="0.01" class="form-control" name="current_usage" value="0">
                                    </div>
                                    <div class="mb-3">
                                        <label>Credit Limit:</label>
                                        <input type="number" step="0.01" class="form-control" name="credit_limit" required>
                                    </div>
                                </div>
                                <div class="tab-pane fade" id="wallet">
                                    <div class="mb-3">
                                        <label>Balance:</label>
                                        <input type="number" step="0.01" class="form-control" name="balance" required>
                                    </div>
                                </div>
                            </div>

                            <button type="submit" class="btn btn-primary">Create</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>`;
        
        // Append the modal to the body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Get the newly created modal
        accountModal = document.getElementById('addAccountModal');
        
        // Initialize the tabs
        const tabs = accountModal.querySelectorAll('#accountTab button');
        const accountTypeInput = accountModal.querySelector('#id_account_type');
        const tabPanes = accountModal.querySelectorAll('.tab-pane');
        
        function updateTabState(selectedTab) {
            accountTypeInput.value = selectedTab.charAt(0).toUpperCase() + selectedTab.slice(1);
            
            tabPanes.forEach(pane => {
                pane.querySelectorAll('input').forEach(input => {
                    if (pane.id === selectedTab) {
                        input.disabled = false;
                        if (input.name !== 'maintaining_balance' && input.name !== 'description') {
                            input.setAttribute('required', 'required');
                        }
                    } else {
                        input.disabled = true;
                        input.removeAttribute('required');
                    }
                });
            });
        }
        
        updateTabState('debit');
        
        tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const selectedTab = tab.getAttribute('data-bs-target').substring(1);
                updateTabState(selectedTab);
            });
        });
        
        // Handle form submission
        const accountForm = accountModal.querySelector('#add-account-form');
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(accountForm);
            
            // Send the request to create a new account
            fetch('/finances/accounts/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => {
                if (response.redirected) {
                    // Success - account created
                    console.log('Account created successfully');
                    
                    // Close the account modal
                    try {
                        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                            const bsModal = bootstrap.Modal.getInstance(accountModal);
                            if (bsModal) {
                                bsModal.hide();
                            }
                        } else {
                            hideModalManually(accountModal);
                        }
                    } catch (error) {
                        console.error('Error hiding account modal:', error);
                    }
                    
                    // Show success message
                    if (typeof showToast === 'function') {
                        showToast('Account Created', 'Your account was created successfully!', 'success');
                    }
                    
                    // Re-open the transaction modal
                    setTimeout(() => {
                        try {
                            if (transactionModalInstance) {
                                transactionModalInstance.show();
                            } else if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
                                const newModal = new bootstrap.Modal(transactionModal);
                                newModal.show();
                            } else {
                                showModalManually(transactionModal);
                            }
                            
                            // Get the current transaction type and refresh the accounts dropdown
                            // This will now fetch and show the newly created account
                            const transactionType = document.getElementById('transaction-type').value;
                            
                            // First invalidate any cache or wait for backend to process the new account
                            setTimeout(() => {
                                checkAndUpdateAccountsDropdown(transactionType, true);
                            }, 500);
                        } catch (error) {
                            console.error('Error showing transaction modal:', error);
                        }
                    }, 300);
                } else {
                    // There was an error - show validation errors or other issues
                    console.error('Error creating account');
                    
                    if (typeof showToast === 'function') {
                        showToast('Error', 'Failed to create account. Please check your inputs.', 'danger');
                    }
                }
            })
            .catch(error => {
                console.error('Error creating account:', error);
                
                if (typeof showToast === 'function') {
                    showToast('Error', 'Failed to create account. Please try again.', 'danger');
                }
            });
        });
    }
    
    // Show the account modal
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(accountModal);
            modal.show();
        } else {
            showModalManually(accountModal);
        }
    } catch (error) {
        console.error('Error showing account modal:', error);
        // If there's an error, re-show the transaction modal
        if (transactionModalInstance) {
            transactionModalInstance.show();
        }
    }
} 