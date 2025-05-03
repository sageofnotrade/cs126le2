document.addEventListener('DOMContentLoaded', function() {
    // Initialize search functionality
    const searchInput = document.getElementById('category-search');
    const categoryList = document.getElementById('category-list');
    const subcategorySelect = document.getElementById('id_subcategory');
    
    // Function to filter categories
    function filterCategories(searchTerm) {
        const items = categoryList.getElementsByClassName('category-item');
        searchTerm = searchTerm.toLowerCase();
        
        Array.from(items).forEach(item => {
            const categoryName = item.querySelector('.category-name').textContent.toLowerCase();
            const subcategories = item.querySelectorAll('.subcategory-item');
            let showCategory = categoryName.includes(searchTerm);
            
            // Also check subcategories
            subcategories.forEach(sub => {
                const subName = sub.textContent.toLowerCase();
                if (subName.includes(searchTerm)) {
                    showCategory = true;
                    sub.style.display = '';
                } else {
                    sub.style.display = searchTerm ? 'none' : '';
                }
            });
            
            item.style.display = showCategory ? '' : 'none';
            
            // If category matches search, show all its subcategories
            if (showCategory && categoryName.includes(searchTerm)) {
                subcategories.forEach(sub => {
                    sub.style.display = '';
                });
            }
        });
    }
    
    // Handle search input
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filterCategories(e.target.value);
        });
    }
    
    // Handle category expansion
    document.querySelectorAll('.category-item').forEach(category => {
        category.addEventListener('click', function(e) {
            if (e.target.closest('.subcategory-item')) return; // Don't toggle if clicking subcategory
            
            const subcategoriesContainer = this.querySelector('.subcategories-container');
            const chevron = this.querySelector('.bi-chevron-right, .bi-chevron-down');
            
            if (subcategoriesContainer) {
                subcategoriesContainer.classList.toggle('show');
                if (chevron) {
                    chevron.classList.toggle('bi-chevron-right');
                    chevron.classList.toggle('bi-chevron-down');
                }
            }
        });
    });
    
    // Handle subcategory selection
    document.querySelectorAll('.subcategory-item').forEach(subcategory => {
        subcategory.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent category expansion toggle
            
            // Remove selection from all subcategories
            document.querySelectorAll('.subcategory-item').forEach(sub => {
                sub.classList.remove('selected');
            });
            
            // Add selection to clicked subcategory
            this.classList.add('selected');
            
            // Update the hidden select input
            const subcategoryId = this.dataset.subcategoryId;
            if (subcategorySelect) {
                subcategorySelect.value = subcategoryId;
                // Trigger change event for any listeners
                subcategorySelect.dispatchEvent(new Event('change'));
            }
        });
    });
}); 