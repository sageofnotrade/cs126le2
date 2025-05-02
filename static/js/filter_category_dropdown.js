/**
 * Filter Category Dropdown Functionality
 * 
 * This script enhances the category filter in the transactions page
 * with a hierarchical dropdown similar to the one in the transaction form.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a page with the category filter
    const categoryFilter = document.getElementById('category-filter');
    if (categoryFilter) {
        console.log('Filter dropdown initialization starting');
        
        // Look for selected values in the data attributes of the body tag if they exist
        const selectedCategory = document.body.getAttribute('data-selected-category') || '';
        const selectedSubcategory = document.body.getAttribute('data-selected-subcategory') || '';
        
        console.log('Selected values from body attributes:', { 
            selectedCategory, 
            selectedSubcategory 
        });
        
        // Look for URL parameters as well
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromUrl = urlParams.get('category');
        const subcategoryFromUrl = urlParams.get('subcategory');
        
        console.log('URL parameters:', { 
            categoryFromUrl, 
            subcategoryFromUrl 
        });
        
        // Use URL parameters if available, otherwise use body attributes
        if (categoryFromUrl) {
            categoryFilter.value = categoryFromUrl;
            console.log('Set category filter value from URL to:', categoryFromUrl);
            
            // Create subcategory field early if needed
            if (subcategoryFromUrl) {
                let subcategoryField = document.getElementById('subcategory-filter');
                if (!subcategoryField) {
                    subcategoryField = document.createElement('input');
                    subcategoryField.type = 'hidden';
                    subcategoryField.id = 'subcategory-filter';
                    subcategoryField.name = 'subcategory';
                    categoryFilter.parentNode.appendChild(subcategoryField);
                    subcategoryField.value = subcategoryFromUrl;
                    console.log('Created subcategory field and set value to:', subcategoryFromUrl);
                }
            }
        } else if (selectedCategory) {
            categoryFilter.value = selectedCategory;
            console.log('Set category filter value from body attribute to:', selectedCategory);
        }
        
        initializeCategoryFilter();
    }
});

function initializeCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');
    
    // Create a hidden field for subcategory ID
    let subcategoryField = document.getElementById('subcategory-filter');
    if (!subcategoryField) {
        subcategoryField = document.createElement('input');
        subcategoryField.type = 'hidden';
        subcategoryField.id = 'subcategory-filter';
        subcategoryField.name = 'subcategory';
        categoryFilter.parentNode.appendChild(subcategoryField);
    }
    
    // Check if we have category/subcategory in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category');
    const subcategoryFromUrl = urlParams.get('subcategory');
    
    // Set initial values from URL parameters if available
    if (categoryFromUrl) {
        categoryFilter.value = categoryFromUrl;
        if (subcategoryFromUrl) {
            subcategoryField.value = subcategoryFromUrl;
        }
    }
    
    // Replace the standard dropdown with a hierarchical list
    createFilterCategoryList(categoryFilter, subcategoryField);
    
    // Add event listeners for filter buttons
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            applyFilters();
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            clearFilters();
            // Reset the hierarchical list selection
            const listContainer = document.querySelector('.filter-category-list');
            if (listContainer) {
                clearAllFilterSelections(listContainer);
            }
        });
    }
}

function createFilterCategoryList(categorySelect, subcategoryField) {
    console.log('Creating hierarchical category list');
    
    // Create container for the hierarchical list
    const listContainer = document.createElement('div');
    listContainer.className = 'filter-category-list w-100';
    
    // Get the current selection
    const selectedCategoryId = categorySelect.value;
    const selectedSubcategoryId = subcategoryField.value;
    
    console.log('Current selection:', { selectedCategoryId, selectedSubcategoryId });
    
    // First, collect all categories and organize them
    const categories = {};
    const subcategories = {};
    
    // Get all options from the original select
    const options = Array.from(categorySelect.options);
    
    // First pass: identify all categories
    options.forEach(option => {
        // Skip the empty option (All Categories)
        if (!option.value) return;
        
        const isCategory = option.getAttribute('data-is-category') === 'true';
        const parentId = option.getAttribute('data-parent-category');
        
        if (isCategory) {
            // This is a main category
            categories[option.value] = {
                id: option.value,
                name: option.text,
                icon: option.getAttribute('data-icon') || 'bi-tag',
                subcategories: []
            };
        } else if (parentId) {
            // This is a subcategory
            const subcategoryId = option.getAttribute('data-subcategory-id');
            
            if (!subcategories[parentId]) {
                subcategories[parentId] = [];
            }
            
            subcategories[parentId].push({
                id: option.value,
                subId: subcategoryId,
                name: option.text,
                icon: option.getAttribute('data-icon') || 'bi-tag-fill'
            });
        }
    });
    
    // Add the "All Categories" option first
    const allCategoriesItem = document.createElement('div');
    allCategoriesItem.className = 'filter-category-item';
    allCategoriesItem.setAttribute('data-category-id', '');
    
    // If no category is selected, mark this as selected
    if (!selectedCategoryId) {
        allCategoriesItem.classList.add('selected');
    }
    
    const allCategoriesHeader = document.createElement('div');
    allCategoriesHeader.className = 'filter-category-header';
    
    const allCategoriesIcon = document.createElement('i');
    allCategoriesIcon.className = 'bi bi-funnel-fill filter-category-icon';
    allCategoriesHeader.appendChild(allCategoriesIcon);
    
    const allCategoriesName = document.createElement('span');
    allCategoriesName.className = 'filter-category-name';
    allCategoriesName.textContent = 'All Categories';
    allCategoriesHeader.appendChild(allCategoriesName);
    
    allCategoriesItem.appendChild(allCategoriesHeader);
    listContainer.appendChild(allCategoriesItem);
    
    // Now build the category list with their subcategories
    Object.values(categories).forEach(category => {
        // Create the category element
        const categoryItem = document.createElement('div');
        categoryItem.className = 'filter-category-item';
        categoryItem.setAttribute('data-category-id', category.id);
        
        // If this category is selected without a subcategory, mark it
        if (category.id === selectedCategoryId && !selectedSubcategoryId) {
            categoryItem.classList.add('selected');
        }
        
        // Create category header (visible even when collapsed)
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'filter-category-header';
        
        // Check if this category has subcategories
        const hasSubcategories = subcategories[category.id] && subcategories[category.id].length > 0;
        
        // Add chevron icon for categories with subcategories
        if (hasSubcategories) {
            const chevron = document.createElement('i');
            chevron.className = 'bi bi-chevron-right filter-category-toggle';
            categoryHeader.appendChild(chevron);
            categoryItem.classList.add('has-subcategories');
            
            // Auto-expand if this category is selected or contains the selected subcategory
            if (category.id === selectedCategoryId) {
                categoryItem.classList.add('expanded');
                chevron.classList.remove('bi-chevron-right');
                chevron.classList.add('bi-chevron-down');
            }
        } else {
            const spacer = document.createElement('span');
            spacer.className = 'filter-category-spacer';
            spacer.style.width = '16px';
            spacer.style.display = 'inline-block';
            categoryHeader.appendChild(spacer);
        }
        
        // Add category icon
        const icon = document.createElement('i');
        icon.className = `bi ${category.icon} filter-category-icon`;
        categoryHeader.appendChild(icon);
        
        // Add category name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'filter-category-name';
        nameSpan.textContent = category.name;
        categoryHeader.appendChild(nameSpan);
        
        // Add header to category item
        categoryItem.appendChild(categoryHeader);
        
        // If this category has subcategories, create the subcategory list
        if (hasSubcategories) {
            const subcategoryList = document.createElement('div');
            subcategoryList.className = 'filter-subcategory-list';
            
            // Add the main category as the first subcategory option
            const mainSubcategoryItem = document.createElement('div');
            mainSubcategoryItem.className = 'filter-subcategory-item main-subcategory';
            mainSubcategoryItem.setAttribute('data-category-id', category.id);
            mainSubcategoryItem.setAttribute('data-subcategory-id', '');
            mainSubcategoryItem.setAttribute('data-sort-order', '0');
            
            // If this is the selected subcategory (main category as subcategory), mark it
            if (category.id === selectedCategoryId && selectedSubcategoryId === '') {
                mainSubcategoryItem.classList.add('selected');
            }
            
            const mainSubcategoryIcon = document.createElement('i');
            mainSubcategoryIcon.className = `bi ${category.icon} filter-subcategory-icon`;
            mainSubcategoryItem.appendChild(mainSubcategoryIcon);
            
            const mainSubcategoryName = document.createElement('span');
            mainSubcategoryName.className = 'filter-subcategory-name';
            mainSubcategoryName.textContent = category.name;
            mainSubcategoryItem.appendChild(mainSubcategoryName);
            
            subcategoryList.appendChild(mainSubcategoryItem);
            
            // Sort the actual subcategories alphabetically
            const sortedSubcategories = [...subcategories[category.id]]
                // Filter out any subcategory that has the same name as its parent category
                .filter(sub => sub.name !== category.name)
                .sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
            
            // Add each subcategory to the list
            sortedSubcategories.forEach((sub, index) => {
                const subcategoryItem = document.createElement('div');
                subcategoryItem.className = 'filter-subcategory-item';
                subcategoryItem.setAttribute('data-category-id', category.id);
                subcategoryItem.setAttribute('data-subcategory-id', sub.subId);
                subcategoryItem.setAttribute('data-sort-order', index + 1);
                
                // If this is the selected subcategory, mark it
                if (category.id === selectedCategoryId && sub.subId === selectedSubcategoryId) {
                    subcategoryItem.classList.add('selected');
                }
                
                const subcategoryIcon = document.createElement('i');
                subcategoryIcon.className = `bi ${sub.icon} filter-subcategory-icon`;
                subcategoryItem.appendChild(subcategoryIcon);
                
                const subcategoryName = document.createElement('span');
                subcategoryName.className = 'filter-subcategory-name';
                subcategoryName.textContent = sub.name;
                subcategoryItem.appendChild(subcategoryName);
                
                subcategoryList.appendChild(subcategoryItem);
            });
            
            categoryItem.appendChild(subcategoryList);
        }
        
        // Add the complete category item to the container
        listContainer.appendChild(categoryItem);
    });
    
    // Add click handler for category headers (to expand/collapse) and item selection
    listContainer.addEventListener('click', function(event) {
        // Remember the current scroll position
        const scrollTop = listContainer.scrollTop;
        
        // Handle clicking on the toggle icon (chevron)
        const toggleIcon = event.target.closest('.filter-category-toggle');
        if (toggleIcon) {
            event.stopPropagation();
            const categoryItem = toggleIcon.closest('.filter-category-item');
            categoryItem.classList.toggle('expanded');
            
            if (categoryItem.classList.contains('expanded')) {
                toggleIcon.classList.remove('bi-chevron-right');
                toggleIcon.classList.add('bi-chevron-down');
            } else {
                toggleIcon.classList.remove('bi-chevron-down');
                toggleIcon.classList.add('bi-chevron-right');
            }
            
            // Restore scroll position
            setTimeout(() => {
                listContainer.scrollTop = scrollTop;
            }, 0);
            return;
        }
        
        // Handle clicking on category header to select the category itself
        const categoryHeader = event.target.closest('.filter-category-header');
        if (categoryHeader) {
            const categoryItem = categoryHeader.closest('.filter-category-item');
            const categoryId = categoryItem.getAttribute('data-category-id');
            
            // Update hidden fields
            categorySelect.value = categoryId;
            subcategoryField.value = '';
            
            // Update visual selection
            clearAllFilterSelections(listContainer);
            categoryItem.classList.add('selected');
            
            // Restore scroll position
            setTimeout(() => {
                listContainer.scrollTop = scrollTop;
            }, 0);
            return;
        }
        
        // Handle selecting a subcategory
        const subcategoryItem = event.target.closest('.filter-subcategory-item');
        if (subcategoryItem) {
            const categoryId = subcategoryItem.getAttribute('data-category-id');
            const subcategoryId = subcategoryItem.getAttribute('data-subcategory-id');
            
            // Update the hidden select fields
            categorySelect.value = categoryId;
            subcategoryField.value = subcategoryId || '';
            
            // Update visual selection
            clearAllFilterSelections(listContainer);
            subcategoryItem.classList.add('selected');
            
            // Restore scroll position
            setTimeout(() => {
                listContainer.scrollTop = scrollTop;
            }, 0);
        }
        
        // Always restore scroll position for any other clicks that weren't handled
        setTimeout(() => {
            listContainer.scrollTop = scrollTop;
        }, 0);
    });
    
    // Hide the original select dropdown
    categorySelect.style.display = 'none';
    
    // Replace the original select with our custom list
    const parentElement = categorySelect.parentElement;
    if (parentElement.querySelector('.filter-category-list')) {
        parentElement.removeChild(parentElement.querySelector('.filter-category-list'));
    }
    
    // Insert the hierarchical list before the hidden select
    parentElement.insertBefore(listContainer, categorySelect);
    
    // Add custom styles for hierarchical list
    addFilterCategoryListStyles();
}

function clearAllFilterSelections(listContainer) {
    listContainer.querySelectorAll('.filter-category-item.selected, .filter-subcategory-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
}

function addFilterCategoryListStyles() {
    // Check if styles are already added
    if (document.getElementById('filter-category-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'filter-category-styles';
    styleElement.textContent = `
        .filter-category-list {
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
            max-height: 200px;
            overflow-y: auto;
            scroll-behavior: auto !important;
            margin-bottom: 10px;
        }
        
        .filter-category-item {
            border-bottom: 1px solid #eee;
            position: relative;
        }
        
        .filter-category-header {
            padding: 8px 12px;
            display: flex;
            align-items: center;
            cursor: pointer;
            background-color: #f8f9fa;
            user-select: none;
            position: relative;
            z-index: 1;
            transition: background-color 0.2s;
        }
        
        .filter-category-item.selected > .filter-category-header {
            background-color: #198754;  /* Bootstrap success green */
            color: white;
            font-weight: bold;
        }
        
        .filter-category-header:hover {
            background-color: #e9ecef;
        }
        
        .filter-category-item.selected > .filter-category-header:hover {
            background-color: #157347;  /* Darker green on hover */
        }
        
        .filter-category-toggle {
            margin-right: 10px;
            transition: transform 0.2s;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            position: relative;
            z-index: 2;
            pointer-events: all;
        }
        
        .filter-category-icon, .filter-subcategory-icon {
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 16px;
            height: 16px;
            pointer-events: none;
        }
        
        .filter-category-item.selected .filter-category-icon {
            color: white;
        }
        
        .filter-category-name, .filter-subcategory-name {
            flex-grow: 1;
            pointer-events: none;
            font-size: 0.875rem;
        }
        
        .filter-subcategory-list {
            display: none;
            border-top: 1px solid #eee;
            background-color: #fff;
            flex-direction: column;
        }
        
        .filter-category-item.expanded .filter-subcategory-list {
            display: flex !important;
        }
        
        .filter-subcategory-item {
            padding: 6px 12px 6px 35px;
            display: flex;
            align-items: center;
            cursor: pointer;
            border-bottom: 1px solid #eee;
            user-select: none;
            position: relative;
            z-index: 1;
            transition: background-color 0.2s;
            font-size: 0.875rem;
        }
        
        /* Ensure main subcategory always appears first */
        .filter-subcategory-item.main-subcategory {
            order: -1;
            font-weight: 500;
            background-color: #f8f9fa;
        }
        
        .filter-subcategory-item.main-subcategory:hover {
            background-color: #e9ecef;
        }
        
        .filter-subcategory-item.main-subcategory.selected {
            background-color: #198754;
            color: white;
            font-weight: bold;
        }
        
        .filter-subcategory-item:last-child {
            border-bottom: none;
        }
        
        .filter-subcategory-item:hover {
            background-color: #e9ecef;
        }
        
        .filter-subcategory-item.selected {
            background-color: #198754;  /* Bootstrap success green */
            color: white;
            font-weight: bold;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
        }
        
        .filter-subcategory-item.selected:hover {
            background-color: #157347;  /* Darker green on hover */
        }
        
        .filter-subcategory-item.selected .filter-subcategory-icon {
            color: white;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Function to apply the filters
function applyFilters() {
    const categoryId = document.getElementById('category-filter').value;
    const subcategoryId = document.getElementById('subcategory-filter').value;
    const titleOrNotes = document.getElementById('from-to-filter').value;
    const includeExpense = document.getElementById('expense-check').checked;
    const includeIncome = document.getElementById('income-check').checked;
    
    console.log('Applying filters:', { 
        categoryId, 
        subcategoryId, 
        titleOrNotes, 
        includeExpense, 
        includeIncome 
    });
    
    // Build the transaction types string
    let transactionTypes = [];
    if (includeExpense) transactionTypes.push('expense');
    if (includeIncome) transactionTypes.push('income');
    
    // Build the query string
    const params = new URLSearchParams(window.location.search);
    
    // Update or remove parameters based on filter values
    if (categoryId) {
        params.set('category', categoryId);
        if (subcategoryId) {
            params.set('subcategory', subcategoryId);
        } else {
            params.delete('subcategory');
        }
    } else {
        params.delete('category');
        params.delete('subcategory');
    }
    
    if (titleOrNotes) {
        params.set('search', titleOrNotes);
    } else {
        params.delete('search');
    }
    
    params.set('types', transactionTypes.join(','));
    
    // Preserve the month parameter if it exists
    if (!params.has('month')) {
        const now = new Date();
        params.set('month', `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`);
    }
    
    // Navigate to the filtered URL
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    console.log('Navigating to:', newUrl);
    window.location.href = newUrl;
}

// Function to clear the filters
function clearFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('subcategory-filter').value = '';
    document.getElementById('from-to-filter').value = '';
    document.getElementById('expense-check').checked = true;
    document.getElementById('income-check').checked = true;
} 