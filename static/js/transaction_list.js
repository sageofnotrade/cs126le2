/**
 * Transaction List AJAX Navigation
 * 
 * This script handles the month navigation in the transactions list using AJAX.
 * It also provides an empty state when there are no transactions.
 */

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
    
    // Set up event listeners
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
    
    // Track the current month and year
    window.currentTransactionMonth = {
        month: parseInt(document.getElementById('current-month-data')?.getAttribute('data-month') || new Date().getMonth() + 1),
        year: parseInt(document.getElementById('current-month-data')?.getAttribute('data-year') || new Date().getFullYear())
    };
    
    // Attach event listeners to transaction checkboxes and actions
    attachTransactionEventListeners();
    
    // Add event listener for browser back/forward navigation
    window.addEventListener('popstate', function(event) {
        console.log('Navigation detected', event);
        
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const monthParam = urlParams.get('month');
            
            if (monthParam && monthParam.includes('-')) {
                try {
                    const [year, month] = monthParam.split('-').map(Number);
                    
                    // Validate the values
                    if (!isNaN(year) && !isNaN(month) && year > 2000 && month >= 1 && month <= 12) {
                        window.currentTransactionMonth = { month, year };
                        loadTransactionsForMonth(urlParams.toString());
                    } else {
                        throw new Error('Invalid month/year values');
                    }
                } catch (e) {
                    console.error('Error parsing month parameter:', e);
                    // Fall back to current month
                    const now = new Date();
                    window.currentTransactionMonth = {
                        month: now.getMonth() + 1,
                        year: now.getFullYear()
                    };
                    loadTransactionsForMonth('');
                }
            } else {
                // Default to current month if no month parameter is in the URL
                const now = new Date();
                window.currentTransactionMonth = {
                    month: now.getMonth() + 1,
                    year: now.getFullYear()
                };
                loadTransactionsForMonth('');
            }
        } catch (error) {
            console.error('Error handling navigation:', error);
            // Recover gracefully
            const now = new Date();
            window.currentTransactionMonth = {
                month: now.getMonth() + 1,
                year: now.getFullYear()
            };
            loadTransactionsForMonth('');
        }
    });
});

/**
 * Navigate to the previous or next month
 * @param {string} direction - 'prev' or 'next'
 */
function navigateMonth(direction) {
    // Get current month and year
    let { month, year } = window.currentTransactionMonth;
    
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
    
    // Update the current month and year
    window.currentTransactionMonth = { month, year };
    
    // Format the month for the URL
    const formattedMonth = `${year}-${month.toString().padStart(2, '0')}`;
    
    // Get current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('month', formattedMonth);
    
    // Update URL without reloading the page
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    // Load transactions for the new month via AJAX
    loadTransactionsForMonth(urlParams.toString());
}

/**
 * Load transactions for a specific month using AJAX
 * @param {string} queryParams - URL query parameters
 * @param {number} retryCount - Number of retries attempted (default: 0)
 */
function loadTransactionsForMonth(queryParams, retryCount = 0) {
    console.log('Loading transactions with params:', queryParams);
    
    // Show loading state
    const transactionList = document.querySelector('.list-group-flush');
    const loadingHTML = `
        <div class="list-group-item py-4 text-center" id="transactions-loading">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 mb-0">Loading transactions...</p>
        </div>
    `;
    
    // Save scroll position
    const scrollPos = window.scrollY;
    
    // Replace content with loading indicator if it's not already there
    if (!document.getElementById('transactions-loading')) {
        transactionList.innerHTML = loadingHTML;
    }
    
    // Create the URL with cache-busting parameter to prevent browser caching
    const timestamp = new Date().getTime();
    const fetchUrl = `/finances/transactions/api/?${queryParams}${queryParams ? '&' : ''}cache_bust=${timestamp}`;
    
    // Fetch transactions data for the month
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
        
        // Update currentTransactionMonth with the received data
        if (data.current_month && data.current_year) {
            window.currentTransactionMonth = {
                month: data.current_month,
                year: data.current_year
            };
        }
        
        // Update UI components
        updateTransactionList(data);
        updateTransactionSummary(data);
        updateMonthDisplay();
        
        // Re-initialize filter dropdown if function exists
        if (typeof initializeCategoryFilter === 'function') {
            setTimeout(() => {
                initializeCategoryFilter();
            }, 100);
        }
        
        // Restore scroll position
        window.scrollTo(0, scrollPos);
        
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
                loadTransactionsForMonth(queryParams, retryCount + 1);
            }, 1000); // Wait 1 second before retrying
            return;
        }
        
        // Show error state with retry button
        transactionList.innerHTML = `
            <div class="list-group-item py-4 text-center">
                <p class="text-danger mb-2">
                    <i class="bi bi-exclamation-triangle"></i> 
                    Error loading transactions: ${error.message || 'Network error'}
                </p>
                <button type="button" class="btn btn-primary btn-sm" id="retry-load-btn">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                </button>
            </div>
        `;
        
        // Add event listener to retry button
        document.getElementById('retry-load-btn')?.addEventListener('click', function() {
            loadTransactionsForMonth(queryParams);
        });
    });
}

/**
 * Update the transaction list with new data
 * @param {Object} data - Transaction data from API
 */
function updateTransactionList(data) {
    const transactionList = document.querySelector('.list-group-flush');
    
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
            document.getElementById('empty-add-income-btn')?.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof openTransactionModal === 'function') {
                    openTransactionModal('income');
                }
            });
            
            document.getElementById('empty-add-expense-btn')?.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof openTransactionModal === 'function') {
                    openTransactionModal('expense');
                }
            });
        }, 100);
        
        return;
    }
    
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
                                <i class="bi ${transaction.display_icon || 'bi-tag'} text-white"></i>
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
                            ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                        </div>
                        <small class="text-muted">${formattedDate}</small>
                    </div>
                    <!-- Transaction Actions -->
                    <div class="dropdown">
                        <button class="btn btn-sm btn-light dropdown-toggle" type="button" id="dropdownMenuButton-${transaction.id}" data-bs-toggle="dropdown" aria-expanded="false">
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton-${transaction.id}" style="position: absolute; inset: 0px 0px auto auto; margin: 0px; transform: translate(-8px, 40px);">
                            <li><a class="dropdown-item edit-transaction" href="#" data-id="${transaction.id}">Edit</a></li>
                            <li><a class="dropdown-item duplicate-transaction" href="#" data-id="${transaction.id}">Duplicate</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item delete-transaction text-danger" href="#" data-id="${transaction.id}">Delete</a></li>
                        </ul>
                    </div>
                </div>
                <!-- Color indicator bar -->
                <div class="position-absolute top-0 bottom-0 end-0 transaction-indicator bg-${transaction.type === 'income' ? 'success' : 'danger'}" style="width: 4px;"></div>
            </div>
        `;
    });
    
    // Update the transaction list
    transactionList.innerHTML = transactionsHTML;
    
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
}

/**
 * Update the transaction summary with new data
 * @param {Object} data - Transaction data from API
 */
function updateTransactionSummary(data) {
    // Check if data exists and has the expected format
    if (!data) {
        console.error('No data provided to updateTransactionSummary');
        return;
    }
    
    // Update transaction count
    const transactionCount = document.getElementById('transaction-count');
    if (transactionCount) {
        const count = data.transactions ? data.transactions.length : 0;
        transactionCount.textContent = count;
    }
    
    // Update total balance
    const transactionTotal = document.getElementById('transaction-total');
    if (transactionTotal) {
        // Ensure we have a number (default to 0 if not present or invalid)
        const totalBalance = (data.total !== undefined && !isNaN(parseFloat(data.total))) 
            ? parseFloat(data.total) 
            : 0;
        
        // Update the color based on the value
        if (totalBalance >= 0) {
            transactionTotal.className = 'text-success';
            transactionTotal.textContent = `+$${totalBalance.toFixed(2)}`;
        } else {
            transactionTotal.className = 'text-danger';
            transactionTotal.textContent = `-$${Math.abs(totalBalance).toFixed(2)}`;
        }
    }
}

/**
 * Update the month display
 */
function updateMonthDisplay() {
    const { month, year } = window.currentTransactionMonth;
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
                if (typeof loadTransactionsForMonth === 'function') {
                    const urlParams = new URLSearchParams(window.location.search);
                    loadTransactionsForMonth(urlParams.toString());
                    
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
            const urlParams = new URLSearchParams(window.location.search);
            loadTransactionsForMonth(urlParams.toString());
            
            if (typeof showToast === 'function') {
                showToast('Success', 'Transaction deleted successfully', 'success');
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
            const urlParams = new URLSearchParams(window.location.search);
            loadTransactionsForMonth(urlParams.toString());
            
            if (typeof showToast === 'function') {
                showToast('Success', `Successfully deleted ${transactionIds.length} transaction(s)`, 'success');
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