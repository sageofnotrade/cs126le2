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
        });
    }
});

function openTransactionModal(type, existingTransaction = null) {
    console.log('openTransactionModal called with type:', type, 'and transaction:', existingTransaction);
    
    // Special handling for edit operations
    const isEdit = existingTransaction && existingTransaction.id;
    
    // Reset form - but be careful with the transaction ID
    document.getElementById('transaction-form').reset();
    
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
    } else {
        // Update modal title based on transaction type for new transactions
        const modalTitle = type === 'income' ? 'Add Income' : 'Add Expense';
        document.getElementById('transactionModalLabel').textContent = modalTitle;
    }
    
    // Filter accounts based on transaction type
    filterAccountsByTransactionType(type);
    
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
    // Validate form
    const form = document.getElementById('transaction-form');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const formData = new FormData(form);
    
    // Make sure the subcategory value is included
    const subcategoryValue = document.getElementById('transaction-subcategory').value;
    if (subcategoryValue) {
        formData.set('subcategory', subcategoryValue);
    } else {
        formData.delete('subcategory');
    }
    
    // Get the transaction ID and determine if this is an edit or new transaction
    const transactionId = document.getElementById('transaction-id').value;
    const isEdit = transactionId && transactionId.trim() !== '';
    
    // Debug what's being sent
    console.log(`Saving transaction (${isEdit ? 'EDIT existing' : 'CREATE new'}) with data:`);
    for (const [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    
    // Handle the AJAX call to save the transaction
    const url = isEdit 
        ? `/finances/transactions/api/${transactionId}/update/` 
        : '/finances/transactions/api/create/';
    
    console.log('Sending data to URL:', url);
    
    // Show a saving indicator
    const saveBtn = document.getElementById('save-transaction-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;
    
    fetch(url, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value,
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            console.error('Server responded with status:', response.status);
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Only now, after successful save, clear the selection
            clearCategorySelection();
            
            console.log(`Transaction ${isEdit ? 'updated' : 'created'} successfully:`, data);
            
            // Ensure all modal elements are properly cleaned up
            const transactionModal = document.getElementById('transactionModal');
            
            // Forcefully clean up all modal-related DOM elements and classes
            // This is a direct approach to prevent screen blackout
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            
            // Remove all backdrop elements
            const backdrops = document.querySelectorAll('.modal-backdrop');
            backdrops.forEach(backdrop => backdrop.remove());
            
            // Hide the modal element
            if (transactionModal) {
                transactionModal.classList.remove('show');
                transactionModal.style.display = 'none';
                transactionModal.setAttribute('aria-hidden', 'true');
            }
            
            // Try Bootstrap hide method as a fallback
            try {
                const bsModal = bootstrap.Modal.getInstance(transactionModal);
                if (bsModal) {
                    bsModal.hide();
                }
            } catch (error) {
                console.warn('Error using Bootstrap to hide modal:', error);
            }
            
            // Refresh transactions via AJAX instead of reloading the page
            if (typeof loadTransactionsForMonth === 'function') {
                // Use a short delay to ensure the modal is fully closed before refreshing
                setTimeout(() => {
                    try {
                        const urlParams = new URLSearchParams(window.location.search);
                        loadTransactionsForMonth(urlParams.toString());
                        
                        // Show success toast
                        const message = isEdit 
                            ? 'Transaction updated successfully!' 
                            : 'Transaction created successfully!';
                        showToast('Success', data.message || message, 'success');
                    } catch (err) {
                        console.error('Error refreshing transaction list:', err);
                        // As a last resort, reload the page
                        window.location.reload();
                    }
                }, 100);
            } else {
                // Fallback to page reload if AJAX function isn't available
                window.location.reload();
            }
        } else {
            // Restore the button if there was an error
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
            
            console.error('Error from server:', data.error);
            showToast('Error', data.error || 'Unknown error', 'danger');
        }
    })
    .catch(error => {
        // Restore the button if there was an error
        saveBtn.textContent = originalText;
        saveBtn.disabled = false;
        
        console.error('Error saving transaction:', error);
        showToast('Error', error.message, 'danger');
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
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
        <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
            <div class="toast-header bg-${type} text-white">
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
    
    // Initialize and show the toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: 5000 });
    toast.show();
    
    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', function() {
        toastElement.remove();
    });
}

function filterAccountsByTransactionType(type) {
    // Only show relevant accounts based on transaction type
    // For example, don't show credit accounts for income transactions
    const accountSelect = document.getElementById('transaction-account');
    const options = accountSelect.querySelectorAll('option');
    
    options.forEach(option => {
        const accountType = option.getAttribute('data-account-type');
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