/**
 * Transaction List AJAX Navigation
 * 
 * This script handles the month navigation in the transactions list using AJAX.
 * It also provides an empty state when there are no transactions.
 */

// Central state management object
window.transactionState = {
    month: null,
    year: null,
    category: null,
    subcategory: null,
    search: null,
    types: null,
    getApiQueryString: function() {
        // Build query string from current state
        const params = [];
        
        if (this.month && this.year) {
            params.push(`month=${this.year}-${this.month.toString().padStart(2, '0')}`);
        }
        
        if (this.category) {
            params.push(`category=${this.category}`);
        }
        
        if (this.subcategory) {
            params.push(`subcategory=${this.subcategory}`);
        }
        
        if (this.search) {
            params.push(`search=${encodeURIComponent(this.search)}`);
        }
        
        if (this.types && this.types.length > 0 && this.types.length < 2) {
            params.push(`types=${this.types.join(',')}`);
        }
        
        // Always include sorting by newest ID first
        params.push('order=-id');
        
        return params.join('&');
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Get month navigation buttons
    const prevMonthBtn = document.getElementById('prev-month-btn');
    const nextMonthBtn = document.getElementById('next-month-btn');
    
    // Test if Bootstrap is properly loaded and Modal functionality works
    console.log('Testing Bootstrap Modal functionality...');
    const deleteModal = document.getElementById('deleteModal');
    if (deleteModal) {
        console.log('Delete modal element found');
        try {
            const bootstrapModal = new bootstrap.Modal(deleteModal);
            console.log('Bootstrap Modal object created successfully');
            // Don't actually show the modal during this test
        } catch (error) {
            console.error('Error creating Bootstrap Modal object:', error);
            alert('Error: Bootstrap Modal functionality is not working correctly. Please check the console for details.');
        }
    } else {
        console.error('deleteModal element not found in the DOM');
    }
    
    // Add test button event listener
    const testDeleteModalBtn = document.getElementById('test-delete-modal');
    if (testDeleteModalBtn) {
        testDeleteModalBtn.addEventListener('click', function() {
            console.log('Test delete modal button clicked');
            testDeleteModal();
        });
    }
    
    // Initialize state from current data attributes
    const currentMonthData = document.getElementById('current-month-data');
    if (currentMonthData) {
        window.transactionState.month = parseInt(currentMonthData.getAttribute('data-month') || new Date().getMonth() + 1);
        window.transactionState.year = parseInt(currentMonthData.getAttribute('data-year') || new Date().getFullYear());
    } else {
        // Default to current month/year
        const now = new Date();
        window.transactionState.month = now.getMonth() + 1;
        window.transactionState.year = now.getFullYear();
    }
    
    // Initialize transaction types
    window.transactionState.types = ['expense', 'income']; // Default to both
    
    // Set up month navigation button event listeners
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function() {
            navigateMonth('prev');
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function() {
            navigateMonth('next');
        });
    }
    
    // Attach event listeners to transaction checkboxes and actions
    attachTransactionEventListeners();
    
    // Set up filter form handlers
    setupFilterHandlers();
    
    // Load initial transactions
    loadTransactions();
});

/**
 * Set up event listeners for the filter form
 */
function setupFilterHandlers() {
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const categoryFilter = document.getElementById('category-filter');
    const searchFilter = document.getElementById('from-to-filter');
    
    // Transaction type filter buttons
    const filterAllBtn = document.getElementById('filter-all');
    const filterIncomeBtn = document.getElementById('filter-income');
    const filterExpenseBtn = document.getElementById('filter-expense');

    // Clear filters button click handler
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            // Reset all filter form elements
            if (categoryFilter) categoryFilter.value = '';
            if (searchFilter) searchFilter.value = '';
            
            // Hide clear search button
            const clearSearchBtn = document.getElementById('clear-search-btn');
            if (clearSearchBtn) clearSearchBtn.classList.add('d-none');
            
            // Reset transaction type buttons to default (all selected)
            if (filterAllBtn) {
                filterAllBtn.classList.add('active');
                window.transactionState.types = ['expense', 'income'];
            }
            if (filterIncomeBtn) filterIncomeBtn.classList.remove('active');
            if (filterExpenseBtn) filterExpenseBtn.classList.remove('active');
            
            // Apply the reset filters
            applyFilters();
        });
    }

    // Transaction type filter buttons
    if (filterAllBtn) {
        filterAllBtn.addEventListener('click', function() {
            // Show all transaction types
            filterAllBtn.classList.add('active');
            filterIncomeBtn.classList.remove('active');
            filterExpenseBtn.classList.remove('active');
            window.transactionState.types = ['expense', 'income'];
            applyFilters();
        });
    }
    
    if (filterIncomeBtn) {
        filterIncomeBtn.addEventListener('click', function() {
            // Show only income
            filterAllBtn.classList.remove('active');
            filterIncomeBtn.classList.add('active');
            filterExpenseBtn.classList.remove('active');
            window.transactionState.types = ['income'];
            applyFilters();
        });
    }
    
    if (filterExpenseBtn) {
        filterExpenseBtn.addEventListener('click', function() {
            // Show only expenses
            filterAllBtn.classList.remove('active');
            filterIncomeBtn.classList.remove('active');
            filterExpenseBtn.classList.add('active');
            window.transactionState.types = ['expense'];
            applyFilters();
        });
    }

    // Enable searching as you type with debouncing
    if (searchFilter) {
        let searchTimeout = null;
        let previousValue = searchFilter.value.trim();
        
        searchFilter.addEventListener('input', function() {
            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            const currentValue = this.value.trim();
            
            // If input was cleared (empty string), apply immediately
            if (previousValue && currentValue === '') {
                previousValue = currentValue;
                applyFilters();
                return;
            }
            
            previousValue = currentValue;
            
            // Set a new timeout for 500ms
            searchTimeout = setTimeout(function() {
                applyFilters();
            }, 500);
        });
        
        // Also keep the Enter key functionality for immediate search
        searchFilter.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                // Clear any pending timeout
                if (searchTimeout) {
                    clearTimeout(searchTimeout);
                }
                applyFilters();
            }
        });
    }

    // Category filter change handler
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            // Debug logging
            console.log('Category filter changed:', this.value);
            console.log('Selected option:', this.options[this.selectedIndex].text);
            
            // Apply filters immediately when a category is selected
            applyFilters();
        });
    }

    // Handle clear search button
    const clearSearchBtn = document.getElementById('clear-search-btn');
    if (searchFilter && clearSearchBtn) {
        // Show/hide clear button based on if there's text in the search field
        searchFilter.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                clearSearchBtn.classList.remove('d-none');
            } else {
                clearSearchBtn.classList.add('d-none');
            }
        });
        
        // Clear search field and apply filters when clicked
        clearSearchBtn.addEventListener('click', function() {
            searchFilter.value = '';
            clearSearchBtn.classList.add('d-none');
            applyFilters();
        });
        
        // Initialize state on page load
        if (searchFilter.value.trim() !== '') {
            clearSearchBtn.classList.remove('d-none');
        }
    }
}

/**
 * Apply filters and load transactions with AJAX
 */
function applyFilters() {
    console.log('applyFilters called');
    
    // Get filter values
    const categoryFilter = document.getElementById('category-filter');
    const searchFilter = document.getElementById('from-to-filter');
    
    console.log('Current category filter value:', categoryFilter ? categoryFilter.value : 'not found');
    console.log('Current search filter value:', searchFilter ? searchFilter.value : 'not found');
    console.log('Current state before update:', { ...window.transactionState });
    
    // Update the state object with filter values
    
    // Handle category and subcategory
    if (categoryFilter && categoryFilter.value) {
        // Get data attributes for selected category/subcategory
        const selectedOption = categoryFilter.options[categoryFilter.selectedIndex];
        
        if (selectedOption.dataset.subcategoryId) {
            window.transactionState.subcategory = selectedOption.dataset.subcategoryId;
            window.transactionState.category = selectedOption.dataset.parentCategory;
            console.log('Setting subcategory filter:', window.transactionState.subcategory);
            console.log('Setting parent category:', window.transactionState.category);
        } else if (selectedOption.dataset.isCategory) {
            window.transactionState.category = selectedOption.value;
            window.transactionState.subcategory = null;
            console.log('Setting category filter:', window.transactionState.category);
            console.log('Clearing subcategory filter');
        }
    } else {
        // Clear category filters if none selected
        window.transactionState.category = null;
        window.transactionState.subcategory = null;
        console.log('Clearing all category filters');
    }
    
    // Handle search filter
    window.transactionState.search = searchFilter && searchFilter.value.trim() ? searchFilter.value.trim() : null;
    
    // Note: Transaction types are now set by the filter buttons directly
    // The window.transactionState.types value is maintained from those buttons
    console.log('State after update:', { ...window.transactionState });
    console.log('API query string:', window.transactionState.getApiQueryString());
    
    // Load transactions with the updated state
    loadTransactions();
}

/**
 * Navigate to the previous or next month
 * @param {string} direction - 'prev' or 'next'
 */
function navigateMonth(direction) {
    // Get current month and year from state
    let { month, year } = window.transactionState;
    
    // Calculate new month and year
    if (direction === 'prev') {
        month--;
        if (month < 1) {
            month = 12;
            year--;
        }
    } else if (direction === 'next') {
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }
    
    // Update the state with new month and year
    window.transactionState.month = month;
    window.transactionState.year = year;
    
    // Update the month display
    updateMonthDisplay();
    
    // Load transactions for the new month via AJAX (preserving filters)
    loadTransactions();
}

/**
 * Load transactions based on current state
 */
function loadTransactions() {
    // Get query string from state object
    const queryString = window.transactionState.getApiQueryString();
    console.log('Loading transactions with query string:', queryString);
    console.log('State at loadTransactions time:', { ...window.transactionState });
    
    // Show loading state
    const transactionList = document.querySelector('.list-group-flush');
    if (!transactionList) {
        console.error('Transaction list container not found');
        return;
    }
    
    // Show loading indicator
    showLoadingIndicator();
    
    // Create the URL with cache-busting parameter to prevent browser caching
    const timestamp = new Date().getTime();
    const fetchUrl = `/finances/transactions/api/?${queryString}${queryString ? '&' : ''}cache_bust=${timestamp}`;
    console.log('Fetching transactions from URL:', fetchUrl);
    
    // Fetch transactions data
    fetch(fetchUrl, {
        method: 'GET',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json'
        },
        credentials: 'same-origin' // Include cookies for authentication
    })
    .then(response => {
        if (!response.ok) {
            console.error(`Server responded with status: ${response.status}`);
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Received transaction data:', data);
        
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid response format');
        }
        
        // Remove loading indicator
        hideLoadingIndicator();
        
        // Update month/year in state if provided
        if (data.current_month && data.current_year) {
            window.transactionState.month = data.current_month;
            window.transactionState.year = data.current_year;
        }
        
        // Update UI components
        updateTransactionList(data);
        updateTransactionSummary(data);
        updateMonthDisplay();
        
        // Re-attach event listeners for transaction actions
        attachTransactionEventListeners();
        
        // If there's a custom global attachDeleteEventHandlers function, use it
        if (typeof window.attachDeleteEventHandlers === 'function') {
            console.log('Calling global attachDeleteEventHandlers function after transaction list update');
            window.attachDeleteEventHandlers();
        }
        
        // Initialize dropdowns on the new transaction items
        if (typeof window.initializeDropdowns === 'function') {
            console.log('Initializing dropdowns after transaction list update');
            setTimeout(window.initializeDropdowns, 10);
        }
    })
    .catch(error => {
        console.error('Error fetching transactions:', error);
        
        // Try to retry a few times before showing error
        if (retryCount < 2) {
            console.log(`Retrying (${retryCount + 1}/2)...`);
            setTimeout(() => {
                loadTransactions(retryCount + 1);
            }, 1000);
        } else {
            // Show error message
            hideLoadingIndicator();
            showErrorMessage('Failed to load transactions. Please try again later.');
        }
    });
}

/**
 * Shows a loading indicator in the transaction list
 */
function showLoadingIndicator() {
    // Only add loading indicator if it doesn't already exist
    if (!document.getElementById('transactions-loading')) {
        const transactionList = document.querySelector('.list-group-flush');
        if (!transactionList) return;
        
        // Add a loading overlay instead of replacing content
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'transactions-loading-overlay';
        loadingOverlay.className = 'position-absolute w-100 h-100 d-flex align-items-center justify-content-center bg-white bg-opacity-75';
        loadingOverlay.style.top = '0';
        loadingOverlay.style.left = '0';
        loadingOverlay.style.zIndex = '10';
        
        loadingOverlay.innerHTML = `
            <div class="text-center" id="transactions-loading">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 mb-0">Loading transactions...</p>
            </div>
        `;
        
        // Add loading overlay to the transaction list container
        const listContainer = transactionList.closest('.card-body') || transactionList.parentElement;
        if (listContainer) {
            // Make the container relative positioning if not already
            if (window.getComputedStyle(listContainer).position === 'static') {
                listContainer.style.position = 'relative';
            }
            listContainer.appendChild(loadingOverlay);
        }
    }
}

/**
 * Hides the loading indicator
 */
function hideLoadingIndicator() {
    const loadingOverlay = document.getElementById('transactions-loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.remove();
    }
}

/**
 * Shows an error message to the user
 * @param {string} message - The error message to display
 */
function showErrorMessage(message) {
    const transactionList = document.querySelector('.list-group-flush');
    if (!transactionList) return;
    
    const errorElement = document.createElement('div');
    errorElement.className = 'alert alert-danger mt-3';
    errorElement.textContent = message;
    
    transactionList.innerHTML = '';
    transactionList.appendChild(errorElement);
}

/**
 * Update the transaction list with new data
 * @param {Object} data - Transaction data from API
 */
function updateTransactionList(data) {
    const transactionList = document.querySelector('.list-group-flush');
    if (!transactionList) {
        console.error('Transaction list element not found');
        return;
    }
    
    // Check if there are any transactions
    if (!data.transactions || data.transactions.length === 0) {
        // Show empty state
        transactionList.innerHTML = `
            <div class="list-group-item py-5 text-center">
                <div class="mb-3">
                    <i class="bi bi-calendar-x text-muted" style="font-size: 3rem;"></i>
                </div>
                <h5 class="text-muted">No transactions found for this period</h5>
                <p class="text-muted mb-4">Try selecting a different month or adding a new transaction.</p>
                <div>
                    <button type="button" class="btn btn-success me-2" id="empty-add-income-btn">
                        <i class="bi bi-plus-circle"></i> Add Income
                    </button>
                    <button type="button" class="btn btn-danger" id="empty-add-expense-btn">
                        <i class="bi bi-dash-circle"></i> Add Expense
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners to empty state buttons
        setTimeout(() => {
            document.getElementById('empty-add-income-btn')?.addEventListener('click', function() {
                document.getElementById('add-income-btn')?.click();
            });
            
            document.getElementById('empty-add-expense-btn')?.addEventListener('click', function() {
                document.getElementById('add-expense-btn')?.click();
            });
        }, 100);
        
        return;
    }
    
    // Prioritize sorting by ID first (newest ID at top) to ensure newly added transactions appear first
    data.transactions.sort((a, b) => {
        // Sort by ID descending (newest first)
        return b.id - a.id;
    });
    
    // Build transaction list HTML
    let transactionsHTML = '';
    
    data.transactions.forEach(transaction => {
        // Format the date for display
        const transactionDate = new Date(transaction.date);
        const formattedDate = transactionDate.toLocaleDateString();
        
        // Build the HTML for each transaction
        transactionsHTML += `
            <div class="list-group-item d-flex justify-content-between align-items-center transaction-item position-relative">
                <div class="d-flex align-items-center">
                    <div class="custom-checkbox me-2">
                        <input class="transaction-check" type="checkbox" value="${transaction.id}" id="check-${transaction.id}">
                        <label class="custom-checkbox-label" for="check-${transaction.id}"></label>
                    </div>
                    <div class="d-flex align-items-center">
                        <div class="transaction-icon me-3">
                            <span class="icon-wrapper rounded-circle bg-${transaction.type === 'income' ? 'success' : 'danger'} p-2">
                                <i class="${transaction.display_icon || 'bi bi-tag'} text-white"></i>
                            </span>
                        </div>
                        <div>
                            <div class="fw-bold">${transaction.title}</div>
                            <small class="text-muted">
                                ${transaction.display_name || 'Uncategorized'}
                                ${transaction.notes ? `- ${transaction.notes}` : ''}
                            </small>
                        </div>
                    </div>
                </div>
                <div class="d-flex align-items-center">
                    <div class="text-end me-3">
                        <div class="text-${transaction.type === 'income' ? 'success' : 'danger'} fw-bold">
                            ${transaction.type === 'income' ? '+' : '-'}₱${parseFloat(transaction.amount).toFixed(2)}
                        </div>
                        <small class="text-muted">${formattedDate}</small>
                    </div>
                    <!-- Updated dropdown markup to match scheduled transactions styling -->
                    <div class="dropdown ms-3">
                        <button class="btn btn-sm btn-light dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li><a class="dropdown-item edit-transaction" href="#" data-id="${transaction.id}">Edit</a></li>
                            <li><a class="dropdown-item duplicate-transaction" href="#" data-id="${transaction.id}">Duplicate</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item delete-transaction text-danger" href="#" data-id="${transaction.id}">Delete</a></li>
                        </ul>
                    </div>
                </div>
                <!-- Color indicator bar -->
                <div class="position-absolute top-0 bottom-0 end-0 transaction-indicator ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}" style="width: 4px;"></div>
            </div>
        `;
    });
    
    // Update the transaction list
    transactionList.innerHTML = transactionsHTML;
}

/**
 * Update transaction summary with new data
 * @param {Object} data - Transaction data from API
 */
function updateTransactionSummary(data) {
    // Update transaction count
    const transactionCountElement = document.getElementById('transaction-count');
    if (transactionCountElement) {
        transactionCountElement.textContent = data.transactions ? data.transactions.length : 0;
    }
    
    // Update total balance
    const transactionTotalElement = document.getElementById('transaction-total');
    if (transactionTotalElement) {
        // Use the correct property from API response - 'total' instead of 'total_balance'
        const totalBalance = data.total || 0;
        const formattedBalance = parseFloat(totalBalance).toFixed(2);
        
        // Format with the appropriate color and sign
        transactionTotalElement.className = totalBalance >= 0 ? 'text-success' : 'text-danger';
        transactionTotalElement.textContent = `₱${formattedBalance}`;
        
        // Add animation for changes
        transactionTotalElement.classList.add('balance-updated');
        setTimeout(() => {
            transactionTotalElement.classList.remove('balance-updated');
        }, 1000);
    }
    
    // Update batch actions visibility based on checked items
    updateBatchActionVisibility();
}

/**
 * Update the month display
 */
function updateMonthDisplay() {
    const { month, year } = window.transactionState;
    console.log('Updating month display:', { month, year });
    
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Update the month display
    const currentMonthElement = document.getElementById('current-month');
    if (currentMonthElement) {
        currentMonthElement.textContent = `${monthNames[month - 1]} ${year}`;
    }
    
    // Update the data attributes
    const currentMonthData = document.getElementById('current-month-data');
    if (currentMonthData) {
        currentMonthData.setAttribute('data-month', month);
        currentMonthData.setAttribute('data-year', year);
    }
}

/**
 * Re-attach event listeners for transaction items
 */
function attachTransactionEventListeners() {
    // Re-attach listeners for checkboxes
    document.querySelectorAll('.transaction-check').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateBatchActionVisibility();
        });
    });
    
    // Select all checkbox
    const selectAllCheckbox = document.querySelector('.select-all-transactions');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.addEventListener('change', function() {
            document.querySelectorAll('.transaction-check').forEach(checkbox => {
                checkbox.checked = selectAllCheckbox.checked;
            });
            updateBatchActionVisibility();
        });
    }
    
    // Re-attach listeners for edit/duplicate/delete actions
    document.querySelectorAll('.edit-transaction').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const transactionId = this.getAttribute('data-id');
            editTransaction(transactionId);
        });
    });
    
    document.querySelectorAll('.duplicate-transaction').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const transactionId = this.getAttribute('data-id');
            duplicateTransaction(transactionId);
        });
    });
    
    document.querySelectorAll('.delete-transaction').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const transactionId = this.getAttribute('data-id');
            deleteTransaction(transactionId);
        });
    });
    
    // Batch delete button
    const batchDeleteBtn = document.querySelector('.batch-delete');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', function() {
            batchDeleteTransactions();
        });
    }
    
    // Initialize Bootstrap dropdowns if available
    if (typeof window.initializeDropdowns === 'function') {
        window.initializeDropdowns();
    } else if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
        document.querySelectorAll('.dropdown-toggle').forEach(dropdown => {
            new bootstrap.Dropdown(dropdown);
        });
    }
}

/**
 * Update visibility of batch actions based on checkbox state
 */
function updateBatchActionVisibility() {
    const checkedBoxes = document.querySelectorAll('.transaction-check:checked');
    const batchActions = document.querySelector('.batch-actions');
    const selectedCount = document.querySelector('.selected-count');
    
    if (batchActions) {
        if (checkedBoxes.length > 0) {
            batchActions.classList.remove('invisible');
            if (selectedCount) {
                selectedCount.textContent = checkedBoxes.length;
            }
        } else {
            batchActions.classList.add('invisible');
        }
    }
}

/**
 * Edit a transaction
 * @param {string} transactionId - The ID of the transaction to edit
 */
function editTransaction(transactionId) {
    console.log('Edit transaction called for ID:', transactionId);
    
    const transactionModal = document.getElementById('transactionModal');
    document.getElementById('transactionModalLabel').textContent = 'Loading...';
    
    // Show the loading modal
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            // Try to use Bootstrap's Modal
            const modal = new bootstrap.Modal(transactionModal);
            modal.show();
        } else {
            // Fallback to manual DOM manipulation
            showModalManually(transactionModal);
        }
    } catch (error) {
        console.error('Error showing modal:', error);
        // Fallback to manual DOM manipulation
        showModalManually(transactionModal);
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
    
    // Fetch transaction details
    fetch(`/finances/transactions/api/${transactionId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(transaction => {
            console.log('Received transaction data for editing:', transaction);
            
            // Ensure transaction has an ID
            if (!transaction.id) {
                transaction.id = transactionId;
                console.log('Added missing ID to transaction data:', transaction);
            }
            
            // Call the openTransactionModal function from transaction.js
            if (typeof openTransactionModal === 'function') {
                console.log('Calling openTransactionModal for editing with data:', transaction);
                openTransactionModal(transaction.type, transaction);
                
                // Double-check that ID is set in the form
                setTimeout(() => {
                    const idField = document.getElementById('transaction-id');
                    console.log('Transaction ID field value after modal opened:', idField.value);
                    
                    if (!idField.value && transaction.id) {
                        console.log('Transaction ID not set properly, forcing it now');
                        idField.value = transaction.id;
                    }
                }, 500);
            } else {
                console.error('openTransactionModal function not found');
                // Fallback to page reload
                window.location.href = `/finances/transactions/edit/${transactionId}/`;
            }
        })
        .catch(error => {
            console.error('Error fetching transaction details:', error);
            console.log('Failed request URL:', `/finances/transactions/api/${transactionId}/`);
            
            // Hide the modal properly
            try {
                const bsModal = bootstrap.Modal.getInstance(transactionModal);
                if (bsModal) {
                    bsModal.hide();
                } else {
                    hideModalManually(transactionModal);
                }
            } catch (err) {
                hideModalManually(transactionModal);
            }
            
            if (typeof showToast === 'function') {
                showToast('Error', 'Failed to load transaction details: ' + error.message + '. Check console for details.', 'danger');
            } else {
                alert('Failed to load transaction details: ' + error.message);
            }
        });
}

/**
 * Duplicate a transaction
 * @param {string} transactionId - The ID of the transaction to duplicate
 */
function duplicateTransaction(transactionId) {
    console.log('Duplicate transaction called for ID:', transactionId);
    
    // Find the transaction to display its name in the confirmation
    const transactionItem = document.querySelector(`.transaction-item .duplicate-transaction[data-id="${transactionId}"]`)?.closest('.transaction-item');
    const transactionTitle = transactionItem ? transactionItem.querySelector('.fw-bold').textContent : 'this transaction';
    
    // Prepare a message for duplication
    const confirmationMessage = `
        <p>Do you want to create a duplicate of the transaction <strong>"${transactionTitle}"</strong>?</p>
        <p>A copy will be created with exactly the same details.</p>
    `;
    
    // Use the global function to show the confirmation modal if available
    if (typeof window.showDeleteConfirmationModal === 'function') {
        console.log('Using global showDeleteConfirmationModal function for duplication');
        window.showDeleteConfirmationModal(
            'Duplicate Transaction',
            confirmationMessage,
            'Duplicate',
            function() {
                // This function will be called when the confirm button is clicked
                performDuplicateTransaction(transactionId);
            }
        );
        return;
    }
    
    // If the global function is not available, fall back to the old implementation
    console.log('Falling back to bootstrap modal implementation for duplication');
    
    // Show confirmation modal
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) {
        console.error('Delete modal element not found!');
        alert('Error: Delete modal element not found in the DOM.');
        return;
    }
    
    const deleteModalLabel = document.getElementById('deleteModalLabel');
    const deleteConfirmationMessage = document.getElementById('delete-confirmation-message');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    if (!deleteModalLabel || !deleteConfirmationMessage || !confirmDeleteBtn) {
        console.error('Delete modal components not found:', {
            label: !!deleteModalLabel,
            message: !!deleteConfirmationMessage,
            button: !!confirmDeleteBtn
        });
        alert('Error: Delete modal components not found.');
        return;
    }
    
    // Update the modal content for duplicate action
    deleteModalLabel.textContent = 'Duplicate Transaction';
    deleteConfirmationMessage.innerHTML = confirmationMessage;
    confirmDeleteBtn.textContent = 'Duplicate';
    confirmDeleteBtn.classList.remove('btn-danger');
    confirmDeleteBtn.classList.add('btn-primary');
    
    // Show the modal
    console.log('Attempting to show duplicate confirmation modal');
    
    // Check bootstrap availability
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not defined - missing bootstrap library');
        alert('Error: Bootstrap library is not loaded.');
        return;
    }
    
    if (typeof bootstrap.Modal === 'undefined') {
        console.error('bootstrap.Modal is not defined - missing Modal component');
        alert('Error: Bootstrap Modal component is not available.');
        return;
    }
    
    let modalInstance;
    try {
        const modal = new bootstrap.Modal(deleteModal);
        modal.show();
        modalInstance = modal;
        console.log('Duplicate confirmation modal shown successfully');
    } catch (error) {
        console.error('Error showing duplicate confirmation modal:', error);
        
        // Try jQuery fallback
        if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
            try {
                console.log('Trying jQuery modal fallback');
                $(deleteModal).modal('show');
                console.log('jQuery modal shown successfully');
            } catch (jqError) {
                console.error('Error showing modal with jQuery:', jqError);
                alert('Could not show duplicate confirmation. Please try again.');
                return;
            }
        } else {
            alert('Error showing duplicate confirmation: ' + error.message);
            return;
        }
    }
    
    // Add event listener for the confirm button
    confirmDeleteBtn.onclick = function() {
        performDuplicateTransaction(transactionId, modalInstance);
    };
    
    // Reset the modal when it's hidden
    deleteModal.addEventListener('hidden.bs.modal', function() {
        // Reset the modal content
        deleteModalLabel.textContent = 'Confirm Delete';
        deleteConfirmationMessage.textContent = 'Are you sure you want to delete this transaction? This action cannot be undone.';
        confirmDeleteBtn.textContent = 'Delete';
        confirmDeleteBtn.classList.remove('btn-primary');
        confirmDeleteBtn.classList.add('btn-danger');
        
        // Remove the event listener
        confirmDeleteBtn.onclick = null;
    }, { once: true });
}

/**
 * Actually performs the duplication of a transaction
 * @param {string} transactionId - The ID of the transaction to duplicate
 * @param {object} modalInstance - Optional bootstrap modal instance to hide
 */
function performDuplicateTransaction(transactionId, modalInstance) {
    console.log('Duplicate confirmed - fetching transaction details');
    
    // Hide the confirmation modal if modalInstance is provided
    if (modalInstance) {
        try {
            modalInstance.hide();
        } catch (error) {
            console.error('Error hiding modal:', error);
            // Try to hide it manually as fallback
            const deleteModal = document.getElementById('deleteModal');
            if (deleteModal) {
                deleteModal.classList.remove('show');
                deleteModal.style.display = 'none';
                document.body.classList.remove('modal-open');
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) backdrop.remove();
            }
        }
    }
    
    // Show a loading indicator
    if (typeof showToast === 'function') {
        showToast('Processing', 'Duplicating transaction...', 'info');
    }
    
    // Fetch transaction details
    fetch(`/finances/transactions/api/${transactionId}/`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(transaction => {
            // Create a duplicate of the transaction directly via the API
            // Skip showing the edit modal and just create the new transaction

            // Prepare form data for the API request
            const formData = new FormData();
            formData.append('title', transaction.title); // Keep same title
            formData.append('amount', transaction.amount);
            formData.append('date', transaction.date.split('T')[0]);
            formData.append('type', transaction.type);
            
            if (transaction.time) {
                formData.append('time', transaction.time);
            }
            
            if (transaction.category) {
                formData.append('category', transaction.category);
            }
            
            if (transaction.subcategory) {
                formData.append('subcategory', transaction.subcategory);
            }
            
            if (transaction.transaction_account) {
                formData.append('transaction_account', transaction.transaction_account);
            }
            
            if (transaction.notes) {
                formData.append('notes', transaction.notes);
            }
            
            // Get CSRF token for the request
            const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
            
            // Send the create request
            return fetch('/finances/transactions/api/create/', {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': csrfToken
                },
                body: formData
            });
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log('Transaction duplicated successfully:', data);
                
                // Refresh the transaction list
                if (typeof loadTransactions === 'function') {
                    loadTransactions();
                    
                    // Show success toast
                    if (typeof showToast === 'function') {
                        showToast('Success', 'Transaction duplicated successfully!', 'success');
                    }
                } else {
                    // Fallback to page reload
                    window.location.reload();
                }
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error duplicating transaction:', error);
            if (typeof showToast === 'function') {
                showToast('Error', 'Failed to duplicate transaction: ' + error.message, 'danger');
            } else {
                alert('Failed to duplicate transaction: ' + error.message);
            }
        });
}

/**
 * Delete a transaction
 * @param {string} transactionId - The ID of the transaction to delete
 */
function deleteTransaction(transactionId) {
    console.log('Delete transaction called for ID:', transactionId);
    
    // Find the transaction to display its name in the confirmation
    const transactionItem = document.querySelector(`.transaction-item .delete-transaction[data-id="${transactionId}"]`)?.closest('.transaction-item');
    const transactionTitle = transactionItem ? transactionItem.querySelector('.fw-bold').textContent : 'this transaction';
    
    console.log('Transaction to delete:', transactionTitle);
    
    // Prepare the confirmation message
    const confirmationMessage = `
        <p>Are you sure you want to delete the transaction <strong>"${transactionTitle}"</strong>?</p>
        <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            This action cannot be undone.
        </div>
    `;
    
    // Use the global function to show the delete confirmation modal if available
    if (typeof window.showDeleteConfirmationModal === 'function') {
        console.log('Using global showDeleteConfirmationModal function');
        window.showDeleteConfirmationModal(
            'Confirm Delete Transaction',
            confirmationMessage,
            'Delete Transaction',
            function() {
                // This function will be called when the confirm button is clicked
                performDeleteTransaction(transactionId);
            }
        );
        return;
    }
    
    // If the global function is not available, fall back to the old implementation
    console.log('Falling back to bootstrap modal implementation');
    
    // Show the delete confirmation modal
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) {
        console.error('Delete modal element not found!');
        alert('Error: Delete modal element not found in the DOM.');
        return;
    }
    
    const deleteModalLabel = document.getElementById('deleteModalLabel');
    const deleteConfirmationMessage = document.getElementById('delete-confirmation-message');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    if (!deleteModalLabel || !deleteConfirmationMessage || !confirmDeleteBtn) {
        console.error('Delete modal components not found:', {
            label: !!deleteModalLabel,
            message: !!deleteConfirmationMessage,
            button: !!confirmDeleteBtn
        });
        alert('Error: Delete modal components not found.');
        return;
    }
    
    // Update modal content for delete action
    deleteModalLabel.textContent = 'Confirm Delete Transaction';
    deleteConfirmationMessage.innerHTML = confirmationMessage;
    confirmDeleteBtn.textContent = 'Delete Transaction';
    confirmDeleteBtn.classList.remove('btn-primary');
    confirmDeleteBtn.classList.add('btn-danger');
    
    // Show the modal
    console.log('Attempting to show delete modal');
    
    // First check if bootstrap is available
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not defined - missing bootstrap library');
        alert('Error: Bootstrap library is not loaded.');
        return;
    }
    
    // Then check if Modal is available
    if (typeof bootstrap.Modal === 'undefined') {
        console.error('bootstrap.Modal is not defined - missing Modal component');
        alert('Error: Bootstrap Modal component is not available.');
        return;
    }
    
    try {
        const modal = new bootstrap.Modal(deleteModal);
        modal.show();
        console.log('Delete modal shown successfully');
    } catch (error) {
        console.error('Error showing delete modal:', error);
        
        // Try an alternative approach using jQuery if available
        if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
            try {
                console.log('Trying jQuery modal fallback');
                $(deleteModal).modal('show');
                console.log('jQuery modal shown successfully');
            } catch (jqError) {
                console.error('Error showing modal with jQuery:', jqError);
                alert('Could not show delete confirmation. Please try again.');
                return;
            }
        } else {
            alert('Error showing delete confirmation: ' + error.message);
            return;
        }
    }
    
    // Keep track of the modal instance
    let modalInstance;
    try {
        modalInstance = bootstrap.Modal.getInstance(deleteModal);
    } catch (error) {
        console.error('Error getting modal instance:', error);
    }
    
    // Add event listener for the confirm button
    confirmDeleteBtn.onclick = function() {
        performDeleteTransaction(transactionId, modalInstance);
    };
    
    // Reset the event listener when the modal is hidden
    deleteModal.addEventListener('hidden.bs.modal', function() {
        confirmDeleteBtn.textContent = 'Delete Transaction';
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.onclick = null;
    }, { once: true });
}

/**
 * Actually performs the delete transaction operation
 * @param {string} transactionId - The ID of the transaction to delete
 * @param {object} modalInstance - Optional bootstrap modal instance to hide
 */
function performDeleteTransaction(transactionId, modalInstance) {
    console.log('Delete confirmed - sending delete request');
    
    // Get confirm button if we need to update its state
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.textContent = 'Deleting...';
        confirmDeleteBtn.disabled = true;
    }
    
    // Send the delete request
    fetch(`/finances/transactions/api/${transactionId}/delete/`, {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Hide the modal if modalInstance is provided
        if (modalInstance) {
            try {
                modalInstance.hide();
            } catch (error) {
                console.error('Error hiding modal:', error);
            }
        }
        
        if (data.success) {
            // Reload transactions for the current month
            if (typeof loadTransactions === 'function') {
                loadTransactions();
                
                if (typeof showToast === 'function') {
                    showToast('Success', 'Transaction deleted successfully', 'success');
                }
            } else {
                // Fallback to page reload
                window.location.reload();
            }
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error deleting transaction:', error);
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.textContent = 'Delete Transaction';
            confirmDeleteBtn.disabled = false;
        }
        
        if (typeof showToast === 'function') {
            showToast('Error', 'Failed to delete transaction: ' + error.message, 'danger');
        } else {
            alert('Error deleting transaction: ' + error.message);
        }
    });
}

/**
 * Batch delete transactions
 */
function batchDeleteTransactions() {
    const checkedBoxes = document.querySelectorAll('.transaction-check:checked');
    if (checkedBoxes.length === 0) return;
    
    const transactionIds = Array.from(checkedBoxes).map(checkbox => checkbox.value);
    const count = transactionIds.length;
    
    console.log('Batch delete triggered for', count, 'transactions');
    
    // Prepare the confirmation message
    const confirmationMessage = `
        <p>Are you sure you want to delete ${count} selected transaction(s)?</p>
        <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            This action cannot be undone.
        </div>
    `;
    
    // Use the global function to show the batch delete confirmation modal if available
    if (typeof window.showDeleteConfirmationModal === 'function') {
        console.log('Using global showDeleteConfirmationModal function for batch delete');
        window.showDeleteConfirmationModal(
            'Confirm Batch Delete',
            confirmationMessage,
            'Delete Selected Transactions',
            function() {
                // This function will be called when the confirm button is clicked
                performBatchDeleteTransactions(transactionIds);
            }
        );
        return;
    }
    
    // If the global function is not available, fall back to the old implementation
    console.log('Falling back to bootstrap modal implementation for batch delete');
    
    // Show the delete confirmation modal
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) {
        console.error('Delete modal element not found!');
        alert('Error: Delete modal element not found in the DOM.');
        return;
    }
    
    const deleteModalLabel = document.getElementById('deleteModalLabel');
    const deleteConfirmationMessage = document.getElementById('delete-confirmation-message');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    if (!deleteModalLabel || !deleteConfirmationMessage || !confirmDeleteBtn) {
        console.error('Delete modal components not found:', {
            label: !!deleteModalLabel,
            message: !!deleteConfirmationMessage,
            button: !!confirmDeleteBtn
        });
        alert('Error: Delete modal components not found.');
        return;
    }
    
    // Update the modal content for batch delete
    deleteModalLabel.textContent = 'Confirm Batch Delete';
    deleteConfirmationMessage.innerHTML = confirmationMessage;
    confirmDeleteBtn.textContent = 'Delete Selected Transactions';
    confirmDeleteBtn.classList.remove('btn-primary');
    confirmDeleteBtn.classList.add('btn-danger');
    
    // Show the modal
    console.log('Attempting to show batch delete modal');
    
    // Check bootstrap availability
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not defined - missing bootstrap library');
        alert('Error: Bootstrap library is not loaded.');
        return;
    }
    
    if (typeof bootstrap.Modal === 'undefined') {
        console.error('bootstrap.Modal is not defined - missing Modal component');
        alert('Error: Bootstrap Modal component is not available.');
        return;
    }
    
    let modalInstance;
    try {
        const modal = new bootstrap.Modal(deleteModal);
        modal.show();
        modalInstance = modal;
        console.log('Batch delete modal shown successfully');
    } catch (error) {
        console.error('Error showing batch delete modal:', error);
        
        // Try jQuery fallback
        if (typeof $ !== 'undefined' && typeof $.fn.modal !== 'undefined') {
            try {
                console.log('Trying jQuery modal fallback');
                $(deleteModal).modal('show');
                console.log('jQuery modal shown successfully');
            } catch (jqError) {
                console.error('Error showing modal with jQuery:', jqError);
                alert('Could not show delete confirmation. Please try again.');
                return;
            }
        } else {
            alert('Error showing delete confirmation: ' + error.message);
            return;
        }
    }
    
    // Add event listener for the confirm button
    confirmDeleteBtn.onclick = function() {
        performBatchDeleteTransactions(transactionIds, modalInstance);
    };
    
    // Reset the event listener when the modal is hidden
    deleteModal.addEventListener('hidden.bs.modal', function() {
        confirmDeleteBtn.textContent = 'Delete Selected Transactions';
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.onclick = null;
    }, { once: true });
}

/**
 * Actually performs the batch delete operation
 * @param {Array} transactionIds - Array of transaction IDs to delete
 * @param {object} modalInstance - Optional bootstrap modal instance to hide
 */
function performBatchDeleteTransactions(transactionIds, modalInstance) {
    console.log('Batch delete confirmed - sending delete request for', transactionIds.length, 'transactions');
    
    // Get confirm button if we need to update its state
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.textContent = 'Deleting...';
        confirmDeleteBtn.disabled = true;
    }
    
    // Send request to delete all selected transactions
    fetch('/finances/transactions/api/batch-delete/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({ transaction_ids: transactionIds })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        // Hide the modal if modalInstance is provided
        if (modalInstance) {
            try {
                modalInstance.hide();
            } catch (error) {
                console.error('Error hiding modal:', error);
            }
        }
        
        if (data.success) {
            // Reload transactions for the current month
            if (typeof loadTransactions === 'function') {
                loadTransactions();
                
                if (typeof showToast === 'function') {
                    showToast('Success', `Successfully deleted ${transactionIds.length} transaction(s)`, 'success');
                }
            } else {
                // Fallback to page reload
                window.location.reload();
            }
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error batch deleting transactions:', error);
        
        if (confirmDeleteBtn) {
            confirmDeleteBtn.textContent = 'Delete Selected Transactions';
            confirmDeleteBtn.disabled = false;
        }
        
        if (typeof showToast === 'function') {
            showToast('Error', 'Failed to delete transactions: ' + error.message, 'danger');
        } else {
            alert('Error deleting transactions: ' + error.message);
        }
    });
}

/**
 * Test function for the delete modal
 */
function testDeleteModal() {
    // Get modal elements
    const deleteModal = document.getElementById('deleteModal');
    const deleteModalLabel = document.getElementById('deleteModalLabel');
    const deleteConfirmationMessage = document.getElementById('delete-confirmation-message');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    
    if (!deleteModal || !deleteModalLabel || !deleteConfirmationMessage || !confirmDeleteBtn) {
        console.error('Delete modal elements not found:', {
            modal: !!deleteModal,
            label: !!deleteModalLabel,
            message: !!deleteConfirmationMessage,
            button: !!confirmDeleteBtn
        });
        alert('Delete modal elements not found. Check the console for details.');
        return;
    }
    
    // Update modal content
    deleteModalLabel.textContent = 'Test Delete Modal';
    deleteConfirmationMessage.innerHTML = `
        <p>This is a test of the delete modal functionality.</p>
        <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            This is just a test, no action will be taken.
        </div>
    `;
    confirmDeleteBtn.textContent = 'Test Button';
    confirmDeleteBtn.classList.remove('btn-primary');
    confirmDeleteBtn.classList.add('btn-danger');
    
    try {
        // Show the modal
        console.log('Attempting to show test delete modal');
        const modal = new bootstrap.Modal(deleteModal);
        modal.show();
        console.log('Test delete modal shown successfully');
        
        // Add a test event to the confirm button
        confirmDeleteBtn.onclick = function() {
            alert('Delete button clicked - this is just a test');
            modal.hide();
        };
        
        // Reset the event listener when the modal is hidden
        deleteModal.addEventListener('hidden.bs.modal', function() {
            confirmDeleteBtn.textContent = 'Delete';
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.onclick = null;
        }, { once: true });
    } catch (error) {
        console.error('Error showing test delete modal:', error);
        alert('Error showing test delete modal: ' + error.message);
    }
} 