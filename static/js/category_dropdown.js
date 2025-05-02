/**
 * Category Dropdown Functionality
 * 
 * This script enhances the category selection by displaying categories with
 * subcategories in a hierarchical expandable list.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on a page with the transaction form
    const categorySelect = document.getElementById('transaction-category');
    if (categorySelect) {
        initializeCategoryList();
    }
});

function initializeCategoryList() {
    const categorySelect = document.getElementById('transaction-category');
    const subcategoryField = document.getElementById('transaction-subcategory');
    
    // Replace the standard dropdown with a hierarchical list
    createHierarchicalCategoryList(categorySelect, subcategoryField);
    
    // When the transaction modal is shown, rebuild the list
    const transactionModal = document.getElementById('transactionModal');
    if (transactionModal) {
        transactionModal.addEventListener('shown.bs.modal', function() {
            createHierarchicalCategoryList(categorySelect, subcategoryField);
        });
    }
}

// Make this function globally available
window.createHierarchicalCategoryList = createHierarchicalCategoryList;

function createHierarchicalCategoryList(categorySelect, subcategoryField) {
    // Create container for the hierarchical list
    const listContainer = document.createElement('div');
    listContainer.className = 'hierarchical-category-list w-100';
    
    // Get current transaction type to filter categories
    const transactionType = document.getElementById('transaction-type').value;
    console.log('Current transaction type:', transactionType);
    
    // Get the current selection
    const selectedCategoryId = categorySelect.value;
    const selectedSubcategoryId = subcategoryField.value;
    console.log('Current selection:', selectedCategoryId, selectedSubcategoryId);
    
    // Get all options from the original select
    const options = Array.from(categorySelect.options);
    console.log('All select options:', options.map(opt => ({
        value: opt.value,
        text: opt.text,
        isCategory: opt.getAttribute('data-is-category'),
        parentId: opt.getAttribute('data-parent-category'),
        type: opt.getAttribute('data-type')
    })));
    
    // Group options by category
    const categories = {};
    options.forEach(option => {
        // Skip the empty option
        if (!option.value) return;
        
        const isCategory = option.getAttribute('data-is-category') === 'true';
        const parentId = option.getAttribute('data-parent-category');
        const optionType = option.getAttribute('data-type');
        
        // Filter by transaction type if specified
        if (optionType && optionType !== transactionType) {
            return;
        }
        
        if (isCategory) {
            // This is a main category
            categories[option.value] = {
                id: option.value,
                name: option.text,
                icon: option.getAttribute('data-icon') || 'bi-tag',
                type: optionType || '',
                subcategories: []
            };
        } else if (parentId) {
            // This is a subcategory
            if (!categories[parentId]) {
                // Parent category doesn't exist yet, create it
                categories[parentId] = {
                    id: parentId,
                    name: 'Unknown',  // Will be updated if we find the parent
                    icon: 'bi-tag',
                    subcategories: []
                };
            }
            
            // Add subcategory to its parent
            categories[parentId].subcategories.push({
                id: option.value,
                subId: option.getAttribute('data-subcategory-id'),
                name: option.text,
                icon: option.getAttribute('data-icon') || 'bi-tag-fill'
            });
        }
    });
    
    console.log('Organized categories:', categories);
    
    // Build list items for categories
    Object.values(categories).forEach(category => {
        // Filter out subcategories with the same name as the parent category
        const realSubcategories = category.subcategories.filter(sub => sub.name !== category.name);
        
        // Create the category element
        const categoryItem = document.createElement('div');
        categoryItem.className = 'category-item';
        categoryItem.setAttribute('data-category-id', category.id);
        
        // If this category is selected, mark it
        if (category.id === selectedCategoryId && !selectedSubcategoryId) {
            categoryItem.classList.add('selected');
        }
        
        // Create category header (visible even when collapsed)
        const categoryHeader = document.createElement('div');
        categoryHeader.className = 'category-header';
        
        // Add chevron icon for categories with subcategories
        if (realSubcategories.length > 0) {
            const chevron = document.createElement('i');
            chevron.className = 'bi bi-chevron-right category-toggle';
            categoryHeader.appendChild(chevron);
            categoryItem.classList.add('has-subcategories');
            
            // Auto-expand if this category contains the selected subcategory
            if (category.id === selectedCategoryId && selectedSubcategoryId) {
                categoryItem.classList.add('expanded');
                chevron.classList.remove('bi-chevron-right');
                chevron.classList.add('bi-chevron-down');
            }
        } else {
            // Add spacing for categories without subcategories
            const spacer = document.createElement('span');
            spacer.className = 'category-spacer';
            spacer.style.width = '16px';
            spacer.style.display = 'inline-block';
            categoryHeader.appendChild(spacer);
        }
        
        // Add category icon
        const icon = document.createElement('i');
        icon.className = `bi ${category.icon} category-icon`;
        categoryHeader.appendChild(icon);
        
        // Add category name
        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name';
        nameSpan.textContent = category.name;
        categoryHeader.appendChild(nameSpan);
        
        // Add header to category item
        categoryItem.appendChild(categoryHeader);
        
        // If this category has real subcategories, create a subcategory list
        if (realSubcategories.length > 0) {
            const subcategoryList = document.createElement('div');
            subcategoryList.className = 'subcategory-list';
            
            // Add the main category as the first subcategory option
            const mainSubcategoryItem = document.createElement('div');
            mainSubcategoryItem.className = 'subcategory-item main-subcategory';
            mainSubcategoryItem.setAttribute('data-category-id', category.id);
            mainSubcategoryItem.setAttribute('data-subcategory-id', '');
            mainSubcategoryItem.setAttribute('data-sort-order', '0'); // Ensure main category is always first
            
            // If this is the selected subcategory (main category as subcategory), mark it
            if (category.id === selectedCategoryId && selectedSubcategoryId === '') {
                mainSubcategoryItem.classList.add('selected');
            }
            
            const mainSubcategoryIcon = document.createElement('i');
            mainSubcategoryIcon.className = `bi ${category.icon} subcategory-icon`;
            mainSubcategoryItem.appendChild(mainSubcategoryIcon);
            
            const mainSubcategoryName = document.createElement('span');
            mainSubcategoryName.className = 'subcategory-name';
            mainSubcategoryName.textContent = category.name;
            mainSubcategoryItem.appendChild(mainSubcategoryName);
            
            subcategoryList.appendChild(mainSubcategoryItem);
            
            // Sort subcategories alphabetically
            const sortedSubcategories = [...realSubcategories].sort((a, b) => a.name.localeCompare(b.name));
            
            // Add actual subcategories
            sortedSubcategories.forEach((sub, index) => {
                const subcategoryItem = document.createElement('div');
                subcategoryItem.className = 'subcategory-item';
                subcategoryItem.setAttribute('data-category-id', category.id);
                subcategoryItem.setAttribute('data-subcategory-id', sub.subId);
                subcategoryItem.setAttribute('data-sort-order', index + 1); // For sorting purposes
                
                // If this is the selected subcategory, mark it
                if (category.id === selectedCategoryId && sub.subId === selectedSubcategoryId) {
                    subcategoryItem.classList.add('selected');
                }
                
                const subcategoryIcon = document.createElement('i');
                subcategoryIcon.className = `bi ${sub.icon} subcategory-icon`;
                subcategoryItem.appendChild(subcategoryIcon);
                
                const subcategoryName = document.createElement('span');
                subcategoryName.className = 'subcategory-name';
                subcategoryName.textContent = sub.name;
                subcategoryItem.appendChild(subcategoryName);
                
                subcategoryList.appendChild(subcategoryItem);
            });
            
            categoryItem.appendChild(subcategoryList);
        }
        
        // Add the category item to the container
        listContainer.appendChild(categoryItem);
    });
    
    // Add click handler for category headers (to expand/collapse) and item selection
    listContainer.addEventListener('click', function(event) {
        console.log('Click event on list container', event.target);
        
        // Remember the current scroll position - do this FIRST for any click
        const scrollTop = listContainer.scrollTop;
        
        // Handle clicking on the toggle icon (chevron)
        const toggleIcon = event.target.closest('.category-toggle');
        if (toggleIcon) {
            event.stopPropagation();
            const categoryItem = toggleIcon.closest('.category-item');
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
        const categoryHeader = event.target.closest('.category-header');
        if (categoryHeader) {
            const categoryItem = categoryHeader.closest('.category-item');
            const categoryId = categoryItem.getAttribute('data-category-id');
            
            console.log('Category selected:', categoryId);
            
            // Update hidden fields
            categorySelect.value = categoryId;
            subcategoryField.value = '';
            
            // Update visual selection - don't clear previous selections here
            // Just add the selected class to this item
            clearAllSelections(listContainer);
            categoryItem.classList.add('selected');
            
            // Trigger change event on the original select
            categorySelect.dispatchEvent(new Event('change'));
            
            // Restore scroll position
            setTimeout(() => {
                listContainer.scrollTop = scrollTop;
            }, 0);
            return;
        }
        
        // Handle selecting a subcategory
        const subcategoryItem = event.target.closest('.subcategory-item');
        if (subcategoryItem) {
            const categoryId = subcategoryItem.getAttribute('data-category-id');
            const subcategoryId = subcategoryItem.getAttribute('data-subcategory-id');
            
            console.log('Subcategory selected:', categoryId, subcategoryId);
            
            // Update the hidden select fields
            categorySelect.value = categoryId;
            subcategoryField.value = subcategoryId || '';
            
            // Update visual selection - don't clear previous selections here
            // Just add the selected class to this item
            clearAllSelections(listContainer);
            subcategoryItem.classList.add('selected');
            
            // Trigger change event on the original select
            categorySelect.dispatchEvent(new Event('change'));
            
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
    
    // Hide the original select dropdowns
    categorySelect.style.display = 'none';
    
    // Replace the original select with our custom list
    const parentElement = categorySelect.parentElement;
    if (parentElement.querySelector('.hierarchical-category-list')) {
        parentElement.removeChild(parentElement.querySelector('.hierarchical-category-list'));
    }
    
    // Insert the hierarchical list before the hidden select
    parentElement.insertBefore(listContainer, categorySelect);
    
    // Add custom styles for hierarchical list
    addHierarchicalListStyles();
}

function clearAllSelections(container) {
    container.querySelectorAll('.category-item.selected, .subcategory-item.selected').forEach(item => {
        item.classList.remove('selected');
    });
}

function addHierarchicalListStyles() {
    // Check if styles are already added
    if (document.getElementById('hierarchical-category-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'hierarchical-category-styles';
    styleElement.textContent = `
        .hierarchical-category-list {
            border: 1px solid #dee2e6;
            border-radius: 0.25rem;
            max-height: 300px;
            overflow-y: auto;
            scroll-behavior: auto !important;
        }
        
        .category-item {
            border-bottom: 1px solid #eee;
            position: relative;
        }
        
        .category-header {
            padding: 10px 15px;
            display: flex;
            align-items: center;
            cursor: pointer;
            background-color: #f8f9fa;
            user-select: none;
            position: relative;
            z-index: 1;
            transition: background-color 0.2s;
        }
        
        .category-item.selected > .category-header {
            background-color: #198754;  /* Bootstrap success green */
            color: white;
            font-weight: bold;
        }
        
        .category-header:hover {
            background-color: #e9ecef;
        }
        
        .category-item.selected > .category-header:hover {
            background-color: #157347;  /* Darker green on hover */
        }
        
        .category-toggle {
            margin-right: 10px;
            transition: transform 0.2s;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            position: relative;
            z-index: 2;
            pointer-events: all;
        }
        
        .category-icon, .subcategory-icon {
            margin-right: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
            pointer-events: none;
        }
        
        .category-item.selected .category-icon {
            color: white;
        }
        
        .category-name, .subcategory-name {
            flex-grow: 1;
            pointer-events: none;
        }
        
        .subcategory-list {
            display: none;
            border-top: 1px solid #eee;
            background-color: #fff;
            flex-direction: column;
        }
        
        .category-item.expanded .subcategory-list {
            display: flex !important;
        }
        
        .subcategory-item {
            padding: 8px 15px 8px 40px;
            display: flex;
            align-items: center;
            cursor: pointer;
            border-bottom: 1px solid #eee;
            user-select: none;
            position: relative;
            z-index: 1;
            transition: background-color 0.2s;
        }
        
        /* Ensure main subcategory always appears first */
        .subcategory-item.main-subcategory {
            order: -1;
            font-weight: 500;
            background-color: #f8f9fa;
        }
        
        .subcategory-item.main-subcategory:hover {
            background-color: #e9ecef;
        }
        
        .subcategory-item.main-subcategory.selected {
            background-color: #198754;
            color: white;
            font-weight: bold;
        }
        
        .subcategory-item:last-child {
            border-bottom: none;
        }
        
        .subcategory-item:hover {
            background-color: #e9ecef;
        }
        
        .subcategory-item.selected {
            background-color: #198754;  /* Bootstrap success green */
            color: white;
            font-weight: bold;
            box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
        }
        
        .subcategory-item.selected:hover {
            background-color: #157347;  /* Darker green on hover */
        }
        
        .subcategory-item.selected .subcategory-icon {
            color: white;
        }
    `;
    
    document.head.appendChild(styleElement);
} 