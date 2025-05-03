/**
 * Scheduled Transaction handling functionality
 * 
 * This script handles the scheduled transaction form interactions including
 * the creation, editing and management of scheduled transactions.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Button handlers for add scheduled transaction
    const createScheduledBtn = document.getElementById('openCreateScheduledModal');
    
    if (createScheduledBtn) {
        createScheduledBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openScheduledTransactionModal();
        });
    }
    
    // Edit scheduled transaction handlers
    document.querySelectorAll('.openEditScheduledModal').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-url');
            openScheduledTransactionModalForEdit(url);
        });
    });
    
    // Delete scheduled transaction handlers
    document.querySelectorAll('.openDeleteScheduledModal').forEach(function(btn) {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-url');
            openDeleteScheduledModal(url);
        });
    });
    
    // Save transaction button handler
    const saveScheduledTransactionBtn = document.getElementById('save-scheduled-transaction-btn');
    if (saveScheduledTransactionBtn) {
        saveScheduledTransactionBtn.addEventListener('click', function() {
            saveScheduledTransaction();
        });
    }
    
    // Initialize form controls
    initScheduledTransactionFormControls();
});

function initScheduledTransactionFormControls() {
    // Transaction type change listener
    const transactionTypeSelect = document.getElementById('scheduled-transaction-type');
    if (transactionTypeSelect) {
        transactionTypeSelect.addEventListener('change', function() {
            filterAccountsByTransactionType(this.value);
            filterCategoriesByTransactionType(this.value, true); // Always reset when manually changing type
        });
    }
    
    // Repeat type change listener
    const repeatTypeSelect = document.getElementById('scheduled-transaction-repeat-type');
    if (repeatTypeSelect) {
        repeatTypeSelect.addEventListener('change', function() {
            updateRepeatsField();
        });
    }
    
    // Set min date for scheduled date input
    const dateScheduledInput = document.getElementById('scheduled-transaction-date');
    if (dateScheduledInput) {
        const now = new Date();
        // Format as YYYY-MM-DDThh:mm
        const formattedDateTime = now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
            String(now.getDate()).padStart(2, '0') + 'T' + 
            String(now.getHours()).padStart(2, '0') + ':' + 
            String(now.getMinutes()).padStart(2, '0');
            
        dateScheduledInput.setAttribute('min', formattedDateTime);
        dateScheduledInput.value = formattedDateTime;
    }
}

function openScheduledTransactionModal() {
    // Reset the form
    const form = document.getElementById('scheduled-transaction-form');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
    }
    
    // Clear hidden ID field
    document.getElementById('scheduled-transaction-id').value = '';
    
    // Reset any custom inputs
    const customInput = document.getElementById('custom-category-input');
    if (customInput) {
        customInput.value = '';
        customInput.classList.remove('is-invalid', 'is-valid');
    }
    
    // Reset the subcategory field
    const subcategoryField = document.getElementById('scheduled-transaction-subcategory');
    if (subcategoryField) {
        subcategoryField.value = '';
    }
    
    // Set default values
    document.getElementById('scheduledTransactionModalLabel').textContent = 'Create Scheduled Transaction';
    
    // Set default date and time to now
    const now = new Date();
    const formattedDateTime = now.getFullYear() + '-' + 
        String(now.getMonth() + 1).padStart(2, '0') + '-' + 
        String(now.getDate()).padStart(2, '0') + 'T' + 
        String(now.getHours()).padStart(2, '0') + ':' + 
        String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('scheduled-transaction-date').value = formattedDateTime;
    
    // Initialize repeats field based on repeat type
    updateRepeatsField();
    
    // Show the modal
    showScheduledModal();
    
    // Initialize the hierarchical category list
    setTimeout(() => {
        createHierarchicalCategoryList(
            document.getElementById('scheduled-transaction-category'),
            document.getElementById('scheduled-transaction-subcategory')
        );
    }, 250);
}

function openScheduledTransactionModalForEdit(url) {
    // First show the modal with loading indicator
    document.getElementById('scheduledTransactionModalLabel').textContent = 'Edit Scheduled Transaction';
    showScheduledModal();
    
    // Add X-Requested-With header to indicate AJAX request
    fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // Check if response is JSON
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return response.json();
            } else {
                throw new Error('Server did not return JSON. Response content type: ' + contentType);
            }
        })
        .then(data => {
            console.log("Received data for editing:", data);
            // Populate the form with the fetched data
            populateScheduledTransactionForm(data);
            
            // Initialize the hierarchical category list with a delay to ensure the DOM is ready
            setTimeout(() => {
                // Create the hierarchical list
                createHierarchicalCategoryList(
                    document.getElementById('scheduled-transaction-category'),
                    document.getElementById('scheduled-transaction-subcategory')
                );
                
                // Update the custom input value with category name after the hierarchical list is created
                updateCustomCategoryInput();
                
                // Ensure visual selection in the hierarchical list matches the selected values
                const categoryId = document.getElementById('scheduled-transaction-category').value;
                const subcategoryId = document.getElementById('scheduled-transaction-subcategory').value;
                
                if (categoryId) {
                    // Find and apply visual selection in the hierarchical list
                    const hierarchicalList = document.querySelector('.hierarchical-category-list');
                    if (hierarchicalList) {
                        // Clear any previous selection
                        const allItems = hierarchicalList.querySelectorAll('.category-item .category-header, .subcategory-item');
                        allItems.forEach(item => item.classList.remove('selected', 'parent-selected'));
                        
                        if (subcategoryId) {
                            // Select subcategory
                            const subcategoryItem = hierarchicalList.querySelector(`.subcategory-item[data-subcategory-id="${subcategoryId}"]`);
                            if (subcategoryItem) {
                                subcategoryItem.classList.add('selected');
                                
                                // Also highlight parent category
                                const parentHeader = subcategoryItem.closest('.category-subcategories')
                                    .previousElementSibling;
                                if (parentHeader) {
                                    parentHeader.classList.add('parent-selected');
                                }
                            }
                        } else {
                            // Select main category
                            const categoryHeader = hierarchicalList.querySelector(`.category-item[data-category-id="${categoryId}"] .category-header`);
                            if (categoryHeader) {
                                categoryHeader.classList.add('selected');
                            }
                        }
                    }
                }
            }, 250);
        })
        .catch(error => {
            console.error('Error fetching scheduled transaction data:', error);
            // Show error message
            showToast('Error', 'Failed to load scheduled transaction data. Please try again.', 'danger');
            // Hide the modal after a short delay
            setTimeout(hideScheduledModal, 500);
        });
}

function populateScheduledTransactionForm(data) {
    console.log("Populating form with data:", data);
    
    // Set the ID
    document.getElementById('scheduled-transaction-id').value = data.id || '';
    
    // Populate basic fields
    document.getElementById('scheduled-transaction-name').value = data.name || '';
    document.getElementById('scheduled-transaction-amount').value = data.amount || '';
    document.getElementById('scheduled-transaction-type').value = data.transaction_type || '';
    
    // Format and set the date
    if (data.date_scheduled) {
        try {
            // Format from ISO string to local datetime format for input
            const date = new Date(data.date_scheduled);
            const formattedDateTime = date.getFullYear() + '-' + 
                String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                String(date.getDate()).padStart(2, '0') + 'T' + 
                String(date.getHours()).padStart(2, '0') + ':' + 
                String(date.getMinutes()).padStart(2, '0');
            
            document.getElementById('scheduled-transaction-date').value = formattedDateTime;
        } catch (e) {
            console.error('Error formatting date:', e);
            // Use the raw value if we can't parse it
            document.getElementById('scheduled-transaction-date').value = data.date_scheduled;
        }
    }
    
    // Set category
    if (data.category) {
        document.getElementById('scheduled-transaction-category').value = data.category;
    }
    
    // Set subcategory if available
    if (data.subcategory) {
        document.getElementById('scheduled-transaction-subcategory').value = data.subcategory;
    } else {
        document.getElementById('scheduled-transaction-subcategory').value = '';
    }
    
    // Set account
    if (data.account) {
        document.getElementById('scheduled-transaction-account').value = data.account;
    }
    
    // Set repeat type and number of repeats
    if (data.repeat_type) {
        document.getElementById('scheduled-transaction-repeat-type').value = data.repeat_type;
        document.getElementById('scheduled-transaction-repeats').value = data.repeats || 1;
        updateRepeatsField();
    }
    
    // Set notes
    if (data.note) {
        document.getElementById('scheduled-transaction-note').value = data.note;
    }
    
    // Filter accounts and categories based on transaction type
    filterAccountsByTransactionType(data.transaction_type);
    filterCategoriesByTransactionType(data.transaction_type, false); // Pass false to prevent resetting values
}

function updateRepeatsField() {
    const repeatType = document.getElementById('scheduled-transaction-repeat-type');
    const repeats = document.getElementById('scheduled-transaction-repeats');
    
    if (repeatType && repeats) {
        if (repeatType.value === 'once') {
            repeats.value = 1;
            repeats.setAttribute('disabled', 'disabled');
        } else {
            repeats.removeAttribute('disabled');
        }
    }
}

function filterAccountsByTransactionType(type) {
    const accountSelect = document.getElementById('scheduled-transaction-account');
    
    if (accountSelect) {
        const options = accountSelect.querySelectorAll('option');
        
        options.forEach(option => {
            if (option.value === '') return; // Skip the placeholder option
            
            const accountType = option.getAttribute('data-account-type');
            
            // For income, hide credit accounts
            if (type === 'income' && accountType === 'credit') {
                option.style.display = 'none';
            } else {
                option.style.display = '';
            }
        });
    }
}

function filterCategoriesByTransactionType(type, shouldReset = true) {
    const categorySelect = document.getElementById('scheduled-transaction-category');
    
    if (categorySelect) {
        const options = categorySelect.querySelectorAll('option');
        
        options.forEach(option => {
            if (option.value === '') return; // Skip the placeholder option
            
            const categoryType = option.getAttribute('data-type');
            
            // Only show categories matching the transaction type
            if (categoryType && categoryType !== type) {
                option.style.display = 'none';
            } else {
                option.style.display = '';
            }
        });
        
        // Also update the hierarchical list if it exists
        const hierarchicalList = document.querySelector('.hierarchical-category-list');
        if (hierarchicalList) {
            const categoryItems = hierarchicalList.querySelectorAll('.category-item');
            categoryItems.forEach(item => {
                const itemType = item.getAttribute('data-type');
                if (itemType && itemType !== type) {
                    item.style.display = 'none';
                } else {
                    item.style.display = '';
                }
            });
            
            // Only reset input if shouldReset is true (not when populating for edit)
            if (shouldReset) {
                // Reset the custom input when changing transaction type
                const customInput = document.getElementById('custom-category-input');
                if (customInput) {
                    customInput.value = '';
                    // Also reset the actual select value
                    categorySelect.value = '';
                    // And the subcategory field
                    const subcategoryField = document.getElementById('scheduled-transaction-subcategory');
                    if (subcategoryField) {
                        subcategoryField.value = '';
                    }
                }
            }
        }
    }
}

// Function to handle category selection
function handleCategorySelection(categoryId, subcategoryId = '') {
    console.log(`Handling category selection. Category ID: ${categoryId}, Subcategory ID: ${subcategoryId}`);
    
    // Update visible category select
    const categorySelect = document.getElementById('scheduled-transaction-category');
    if (categorySelect) {
        categorySelect.value = categoryId;
    }
    
    // Update hidden subcategory field
    const subcategoryField = document.getElementById('scheduled-transaction-subcategory');
    if (subcategoryField) {
        subcategoryField.value = subcategoryId;
    }
    
    // Update the visual representation in the hierarchical list
    const hierarchicalList = document.querySelector('.hierarchical-category-list');
    if (hierarchicalList) {
        // Clear any previous selection
        const allItems = hierarchicalList.querySelectorAll('.category-item, .subcategory-item');
        allItems.forEach(item => item.classList.remove('selected'));
        
        // Apply selection to the appropriate item
        if (subcategoryId) {
            const selectedSubcategory = hierarchicalList.querySelector(`.subcategory-item[data-subcategory-id="${subcategoryId}"]`);
            if (selectedSubcategory) {
                selectedSubcategory.classList.add('selected');
                
                // Also highlight the parent category
                const parentCategory = selectedSubcategory.closest('.category-subcategories')
                    .previousElementSibling.querySelector('.category-header');
                if (parentCategory) {
                    parentCategory.classList.add('parent-selected');
                }
            }
        } else {
            const selectedCategory = hierarchicalList.querySelector(`.category-item[data-category-id="${categoryId}"] .category-header`);
            if (selectedCategory) {
                selectedCategory.classList.add('selected');
            }
        }
    }
}

// Function to create the hierarchical category list
function createHierarchicalCategoryList(categorySelect, subcategoryField) {
    console.log('Creating hierarchical category list');
    
    if (!categorySelect || !subcategoryField) {
        console.error('Category select or subcategory field not found');
        return;
    }
    
    // Get the current transaction type
    const transactionType = document.getElementById('scheduled-transaction-type').value;
    
    // Create wrapper div for the dropdown-like behavior
    let dropdownWrapper = categorySelect.parentNode;
    
    // Save the current values before manipulating the DOM
    const currentCategoryId = categorySelect.value;
    const currentSubcategoryId = subcategoryField.value;
    
    // Get container for the list
    let container = document.querySelector('.hierarchical-category-list');
    
    // If the container doesn't exist yet, create it
    if (!container) {
        container = document.createElement('div');
        container.className = 'hierarchical-category-list mt-2';
        container.style.display = 'none'; // Hidden by default
        container.style.position = 'absolute';
        container.style.zIndex = '1000';
        container.style.width = '100%'; // Set width to 100% of parent
        container.style.maxHeight = '300px';
        container.style.overflowY = 'auto';
        container.style.overflowX = 'hidden'; // Prevent horizontal scrolling
        container.style.backgroundColor = '#fff';
        container.style.border = '1px solid #dee2e6';
        container.style.borderRadius = '0.25rem';
        container.style.boxShadow = '0 0.5rem 1rem rgba(0, 0, 0, 0.15)';
        dropdownWrapper.appendChild(container);
        
        // Override any potentially problematic positioning
        dropdownWrapper.style.position = 'relative';
        
        // Hide the original select element but keep it in the form for submission
        categorySelect.style.display = 'none';
        
        // Create a custom input to display the selected category
        const customInput = document.createElement('input');
        customInput.type = 'text';
        customInput.className = 'form-control';
        customInput.id = 'custom-category-input';
        customInput.placeholder = 'Select a category';
        customInput.readOnly = true;
        customInput.style.cursor = 'pointer';
        customInput.style.backgroundColor = '#fff';
        customInput.style.height = '46px'; // Match the height of other form inputs
        
        // Add event listener to toggle the dropdown
        customInput.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (container.style.display === 'none') {
                // Position the dropdown precisely below the input
                const inputRect = customInput.getBoundingClientRect();
                const modalBody = customInput.closest('.modal-body');
                const modalRect = modalBody ? modalBody.getBoundingClientRect() : null;
                
                container.style.width = customInput.offsetWidth + 'px';
                container.style.display = 'block';
                
                // Adjust position if near bottom of modal
                const containerRect = container.getBoundingClientRect();
                if (modalRect && (inputRect.bottom + containerRect.height > modalRect.bottom)) {
                    // Position above the input if not enough space below
                    container.style.maxHeight = (inputRect.top - modalRect.top - 10) + 'px';
                }
            } else {
                container.style.display = 'none';
            }
        });
        
        // Insert the custom input before the container
        dropdownWrapper.insertBefore(customInput, container);
        
        // Close the dropdown when clicking outside
        document.addEventListener('click', function(e) {
            // Only proceed if container is visible
            if (container.style.display === 'block') {
                // Check if click is outside the input and dropdown
                if (!customInput.contains(e.target) && !container.contains(e.target)) {
                    container.style.display = 'none';
                }
            }
        });
    }
    
    // Clear the existing content
    container.innerHTML = '';
    
    // Create a map of categories and their subcategories
    const categories = {};
    const options = categorySelect.querySelectorAll('option');
    
    options.forEach(option => {
        if (option.value === '') return; // Skip the placeholder option
        
        const isCategory = option.getAttribute('data-is-category') === 'true';
        const categoryType = option.getAttribute('data-type');
        
        // Skip categories that don't match the transaction type
        if (transactionType && categoryType && categoryType !== transactionType) {
            return;
        }
        
        if (isCategory) {
            // This is a main category
            categories[option.value] = {
                id: option.value,
                name: option.textContent.trim(),
                icon: option.getAttribute('data-icon') || 'bi-tag',
                type: categoryType,
                subcategories: []
            };
        } else {
            // This is a subcategory
            const parentCategoryId = option.getAttribute('data-parent-category');
            const subcategoryId = option.getAttribute('data-subcategory-id') || option.value;
            
            if (parentCategoryId && categories[parentCategoryId]) {
                categories[parentCategoryId].subcategories.push({
                    id: subcategoryId,
                    parentId: parentCategoryId,
                    name: option.textContent.trim(),
                    icon: option.getAttribute('data-icon') || categories[parentCategoryId].icon
                });
            }
        }
    });
    
    // Now build the hierarchical list
    Object.values(categories).forEach(category => {
        // Create category item
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.setAttribute('data-category-id', category.id);
        categoryItem.setAttribute('data-type', category.type);
        
        // Create category header
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        
        // Create icon
        const icon = document.createElement('i');
        icon.className = category.icon + ' me-2';
        
        // Create category name
        const categoryName = document.createElement('span');
        categoryName.textContent = category.name;
        categoryName.style.overflow = 'hidden';
        categoryName.style.textOverflow = 'ellipsis';
        categoryName.style.whiteSpace = 'nowrap';
        categoryName.style.maxWidth = 'calc(100% - 40px)'; // Account for icon space
        
        // Assemble category header
        categoryHeader.appendChild(icon);
        categoryHeader.appendChild(categoryName);
        
        // Add event listener to category header
        categoryHeader.addEventListener('click', function() {
            handleCategorySelection(category.id, '');
            document.getElementById('custom-category-input').value = category.name;
            container.style.display = 'none';
        });
        
        // Create container for subcategories
        const subcategoriesContainer = document.createElement('div');
        subcategoriesContainer.className = 'category-subcategories';
        
        // Add subcategories
        category.subcategories.forEach(subcategory => {
            const subcategoryItem = document.createElement('div');
            subcategoryItem.className = 'subcategory-item';
            subcategoryItem.setAttribute('data-category-id', subcategory.parentId);
            subcategoryItem.setAttribute('data-subcategory-id', subcategory.id);
            
            // Create subcategory icon
            const subIcon = document.createElement('i');
            subIcon.className = subcategory.icon + ' me-2';
            
            // Create subcategory name
            const subcategoryName = document.createElement('span');
            subcategoryName.textContent = subcategory.name;
            subcategoryName.style.overflow = 'hidden';
            subcategoryName.style.textOverflow = 'ellipsis';
            subcategoryName.style.whiteSpace = 'nowrap';
            subcategoryName.style.maxWidth = 'calc(100% - 40px)'; // Account for icon space
            
            // Assemble subcategory item
            subcategoryItem.appendChild(subIcon);
            subcategoryItem.appendChild(subcategoryName);
            
            // Add event listener to subcategory item
            subcategoryItem.addEventListener('click', function() {
                handleCategorySelection(subcategory.parentId, subcategory.id);
                document.getElementById('custom-category-input').value = category.name + ' - ' + subcategory.name;
                container.style.display = 'none';
            });
            
            // Add to container
            subcategoriesContainer.appendChild(subcategoryItem);
        });
        
        // Assemble category item
        categoryItem.appendChild(categoryHeader);
        categoryItem.appendChild(subcategoriesContainer);
        
        // Add to container
        container.appendChild(categoryItem);
    });
    
    // Restore previously selected values
    categorySelect.value = currentCategoryId;
    subcategoryField.value = currentSubcategoryId;
    
    // Check if we should highlight a selection and update the custom input
    if (currentCategoryId) {
        // Find the category information
        const categoryOption = categorySelect.querySelector(`option[value="${currentCategoryId}"]`);
        let categoryName = categoryOption ? categoryOption.textContent.trim() : '';
        
        // If we have a subcategory, highlight it and update the input value
        if (currentSubcategoryId) {
            const subcategoryItem = container.querySelector(`.subcategory-item[data-subcategory-id="${currentSubcategoryId}"]`);
            if (subcategoryItem) {
                subcategoryItem.classList.add('selected');
                
                // Also highlight parent category header
                const parentCategory = subcategoryItem.closest('.category-subcategories')
                    .previousElementSibling;
                if (parentCategory) {
                    parentCategory.classList.add('parent-selected');
                }
                
                // Find the subcategory name
                let subcategoryName = '';
                
                // First try to find by value
                const subcategoryOptionByValue = categorySelect.querySelector(`option[value="${currentSubcategoryId}"]`);
                if (subcategoryOptionByValue) {
                    subcategoryName = subcategoryOptionByValue.textContent.trim();
                } else {
                    // Try by data-subcategory-id attribute
                    const subcategoryOptionById = categorySelect.querySelector(`option[data-subcategory-id="${currentSubcategoryId}"]`);
                    if (subcategoryOptionById) {
                        subcategoryName = subcategoryOptionById.textContent.trim();
                    }
                }
                
                // Update custom input
                const customInput = document.getElementById('custom-category-input');
                if (customInput && categoryName && subcategoryName) {
                    customInput.value = `${categoryName} - ${subcategoryName}`;
                } else if (customInput && categoryName) {
                    customInput.value = categoryName;
                }
            }
        } else {
            // Otherwise highlight the category
            const categoryHeader = container.querySelector(`.category-item[data-category-id="${currentCategoryId}"] .category-header`);
            if (categoryHeader) {
                categoryHeader.classList.add('selected');
                
                // Update custom input
                const customInput = document.getElementById('custom-category-input');
                if (customInput && categoryName) {
                    customInput.value = categoryName;
                }
            }
        }
    }
    
    // Add CSS for the hierarchical list if it doesn't exist
    if (!document.getElementById('hierarchical-list-style')) {
        const style = document.createElement('style');
        style.id = 'hierarchical-list-style';
        style.textContent = `
            .category-header {
                padding: 8px 12px;
                background-color: #f8f9fa;
                border-bottom: 1px solid #f0f0f0;
                cursor: pointer;
                display: flex;
                align-items: center;
                font-weight: 500;
            }
            .category-header:hover {
                background-color: #e9ecef;
            }
            .category-header.selected, .category-header.parent-selected {
                background-color: rgba(13, 110, 253, 0.15);
                border-left: 3px solid #0d6efd;
                padding-left: 9px;
            }
            .subcategory-item {
                padding: 8px 12px 8px 24px;
                cursor: pointer;
                display: flex;
                align-items: center;
                border-bottom: 1px solid #f0f0f0;
            }
            .subcategory-item:hover {
                background-color: #f8f9fa;
            }
            .subcategory-item.selected {
                background-color: rgba(13, 110, 253, 0.15);
                border-left: 3px solid #0d6efd;
                padding-left: 21px;
            }
            /* Ensure text doesn't overflow */
            .category-header span, .subcategory-item span {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: calc(100% - 40px);
            }
            /* Fix for dropdown in modal */
            .modal-body .hierarchical-category-list {
                max-width: 100%;
                left: 0;
                right: 0;
            }
        `;
        document.head.appendChild(style);
    }
}

// Function to update the custom category input field based on selected category/subcategory
function updateCustomCategoryInput() {
    const categorySelect = document.getElementById('scheduled-transaction-category');
    const subcategoryField = document.getElementById('scheduled-transaction-subcategory');
    const customInput = document.getElementById('custom-category-input');
    
    if (!categorySelect || !customInput) {
        return;
    }
    
    let displayText = '';
    
    if (categorySelect.value) {
        // Find the selected category
        const categoryOption = categorySelect.querySelector(`option[value="${categorySelect.value}"]`);
        if (categoryOption) {
            displayText = categoryOption.textContent.trim();
            
            // If subcategory is selected, add it to the display text
            if (subcategoryField && subcategoryField.value) {
                const subcategoryOption = categorySelect.querySelector(`option[value="${subcategoryField.value}"]`);
                if (subcategoryOption) {
                    displayText += ' - ' + subcategoryOption.textContent.trim();
                } else {
                    // Try finding by data-subcategory-id attribute as a fallback
                    const altSubcategoryOption = categorySelect.querySelector(`option[data-subcategory-id="${subcategoryField.value}"]`);
                    if (altSubcategoryOption) {
                        displayText += ' - ' + altSubcategoryOption.textContent.trim();
                    }
                }
            }
        }
    }
    
    customInput.value = displayText;
}

function saveScheduledTransaction() {
    // Validate form
    const form = document.getElementById('scheduled-transaction-form');
    
    // Check if category is selected before validating the form
    const categorySelect = document.getElementById('scheduled-transaction-category');
    const customInput = document.getElementById('custom-category-input');
    
    if (categorySelect && customInput) {
        if (!categorySelect.value) {
            // Mark the custom input as invalid
            customInput.classList.add('is-invalid');
            if (!form.classList.contains('was-validated')) {
                form.classList.add('was-validated');
            }
            return;
        } else {
            // Mark as valid
            customInput.classList.remove('is-invalid');
            customInput.classList.add('is-valid');
        }
    }
    
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }
    
    // Get form data
    const formData = new FormData(form);
    const id = document.getElementById('scheduled-transaction-id').value;
    const isEdit = id && id !== '';
    
    // Determine the URL based on whether it's an edit or create operation
    let url;
    if (isEdit) {
        url = `/finances/scheduled/edit/${id}/`;
    } else {
        url = '/finances/scheduled/create/';
    }
    
    console.log("Submitting form to URL:", url);
    
    // Send the request
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
            console.log(`Scheduled transaction ${isEdit ? 'updated' : 'created'} successfully:`, data);
            
            // Close modal
            hideScheduledModal();
            
            // Show success message
            showToast(
                isEdit ? 'Transaction Updated' : 'Transaction Created', 
                isEdit ? 
                    'The scheduled transaction was successfully updated.' : 
                    'The scheduled transaction was successfully created.',
                'success'
            );
            
            // Reload the page to show the updated data
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } else {
            console.error('Error saving scheduled transaction:', data.errors);
            showToast('Error', 'Failed to save scheduled transaction: ' + data.errors, 'danger');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Error', 'An error occurred while saving the transaction.', 'danger');
    });
}

function openDeleteScheduledModal(url) {
    const modal = document.getElementById('deleteScheduledModal');
    const modalBody = document.getElementById('deleteScheduledModalBody');
    
    // Show loading indicator
    modalBody.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    
    // Show the modal
    try {
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        } else {
            showModalManually(modal);
        }
        
        // Fetch the confirmation content
        fetch(url)
            .then(response => response.text())
            .then(html => {
                modalBody.innerHTML = html;
            })
            .catch(error => {
                console.error('Error loading delete confirmation:', error);
                modalBody.innerHTML = '<div class="alert alert-danger">Error loading delete confirmation. Please try again.</div>';
            });
    } catch (error) {
        console.error('Error showing delete modal:', error);
    }
}

function showScheduledModal() {
    const modal = document.getElementById('scheduledTransactionModal');
    
    try {
        // Attempt to use Bootstrap's modal
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();
        } else {
            // Fallback to manual DOM manipulation
            showModalManually(modal);
        }
    } catch (error) {
        console.error('Error showing modal:', error);
        // Fallback to manual DOM manipulation
        showModalManually(modal);
    }
}

function hideScheduledModal() {
    const modal = document.getElementById('scheduledTransactionModal');
    
    try {
        // Try Bootstrap's method first
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
            bsModal.hide();
            return;
        }
    } catch (error) {
        console.warn('Error using Bootstrap to hide modal:', error);
    }
    
    // Fallback to manual closing
    modal.classList.remove('show');
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    
    // Remove backdrop manually
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Reset body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
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

function hideModalManually(modalElement) {
    if (!modalElement) return;
    
    modalElement.style.display = 'none';
    modalElement.classList.remove('show');
    
    // Remove the backdrop
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Reset body
    document.body.classList.remove('modal-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
}

// Toast notification function
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
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Create toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <strong>${title}</strong>: ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    try {
        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 5000 });
        bsToast.show();
    } catch (err) {
        console.warn('Could not show toast with Bootstrap:', err);
        // Fallback if Bootstrap is not available
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
            toastContainer.removeChild(toast);
        }, 5000);
    }
} 