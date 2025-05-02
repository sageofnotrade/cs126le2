// Initialize Bootstrap components
document.addEventListener('DOMContentLoaded', function() {
    // No need to manually initialize modals in Bootstrap 5
    
    // Setup for add budget modal
    const addBudgetForm = document.getElementById('addBudgetForm');
    if (addBudgetForm) {
        addBudgetForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get selected category/subcategory
            const categorySelect = document.getElementById('budget-category');
            const subcategoryField = document.getElementById('budget-subcategory');
            
            // Validate form (check if category is selected)
            if (!categorySelect.value) {
                alert('Please select a category');
                return;
            }
            
            // If subcategory field is empty, but the selected option is a main category (not a subcategory),
            // this means either the category has no subcategories or user directly selected a category
            // In this case, we should continue to submit the form
            const selectedOption = categorySelect.options[categorySelect.selectedIndex];
            const isMainCategory = selectedOption && selectedOption.getAttribute('data-is-category') === 'true';
            
            // Only validate subcategory if there are subcategories available
            if (!subcategoryField.value && !isMainCategory) {
                alert('Please select a subcategory');
                return;
            }
            
            // Submit form via AJAX
            submitBudgetForm(this, 'add');
        });
    }
    
    // Setup for edit budget modal
    const editBudgetForm = document.getElementById('editBudgetForm');
    if (editBudgetForm) {
        editBudgetForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Get selected category/subcategory
            const categorySelect = document.getElementById('edit-budget-category');
            const subcategoryField = document.getElementById('edit-budget-subcategory');
            
            // Validate form (check if category is selected)
            if (!categorySelect.value) {
                alert('Please select a category');
                return;
            }
            
            // If subcategory field is empty, but the selected option is a main category (not a subcategory),
            // this means either the category has no subcategories or user directly selected a category
            // In this case, we should continue to submit the form
            const selectedOption = categorySelect.options[categorySelect.selectedIndex];
            const isMainCategory = selectedOption && selectedOption.getAttribute('data-is-category') === 'true';
            
            // Only validate subcategory if there are subcategories available
            if (!subcategoryField.value && !isMainCategory) {
                alert('Please select a subcategory');
                return;
            }
            
            // Submit form via AJAX
            submitBudgetForm(this, 'edit');
        });
    }
    
    // Setup for delete budget modal
    $('#deleteBudgetModal').on('show.bs.modal', function(event) {
        const button = $(event.relatedTarget);
        const budgetId = button.data('id');
        document.getElementById('delete_budget_id').value = budgetId;
    });
    
    const deleteBudgetForm = document.getElementById('deleteBudgetForm');
    if (deleteBudgetForm) {
        deleteBudgetForm.addEventListener('submit', function(event) {
            event.preventDefault();
            
            const budgetId = document.getElementById('delete_budget_id').value;
            
            // Submit form via AJAX
            fetch('/finances/budgets/delete/', {
                method: 'POST',
                body: new FormData(this),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Close modal and reload page
                    $('#deleteBudgetModal').modal('hide');
                    window.location.reload();
                } else {
                    alert('Error deleting budget: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while deleting the budget');
            });
        });
    }
    
    // Handle edit budget modal data population
    $('#editBudgetModal').on('show.bs.modal', function(event) {
        const button = $(event.relatedTarget);
        const budgetId = button.data('id');
        const amount = button.data('amount');
        const startDate = button.data('start_date');
        const endDate = button.data('end_date');
        const duration = button.data('duration');
        
        document.getElementById('budget_id').value = budgetId;
        document.getElementById('id_amount').value = amount;
        
        // Set duration
        const durationSelect = document.getElementById('id_duration');
        for (let i = 0; i < durationSelect.options.length; i++) {
            if (durationSelect.options[i].value === duration) {
                durationSelect.selectedIndex = i;
                break;
            }
        }
    });
    
    // Helper function to submit budget forms via AJAX
    function submitBudgetForm(form, action) {
        const url = action === 'add' ? '/finances/budgets/add/' : '/finances/budgets/edit/';
        
        fetch(url, {
            method: 'POST',
            body: new FormData(form),
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Close modal and reload page
                $(`#${action}BudgetModal`).modal('hide');
                window.location.reload();
            } else {
                // Display error message
                alert('Error saving budget: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while saving the budget');
        });
    }
});

// Function to display form errors
function displayFormErrors(form, errors) {
    // Clear existing errors
    form.find('.invalid-feedback').remove();
    form.find('.is-invalid').removeClass('is-invalid');
    
    // Add new errors
    for (var field in errors) {
        var input = form.find(`[name="${field}"]`);
        input.addClass('is-invalid');
        
        var errorDiv = $('<div>')
            .addClass('invalid-feedback')
            .text(errors[field].join(' '));
        
        input.after(errorDiv);
    }
}

// Function to clear form errors
function clearFormErrors(form) {
    form.find('.invalid-feedback').remove();
    form.find('.is-invalid').removeClass('is-invalid');
}

// Handle Add Budget Modal
$('#addBudgetModal').on('show.bs.modal', function (event) {
    var modal = $(this);
    // Reset the form
    modal.find('form')[0].reset();
    clearFormErrors(modal.find('form'));
    
    // Set default dates
    var today = new Date();
    modal.find('#id_start_date').val(today.toISOString().split('T')[0]);
});

// Handle Edit Budget Modal
$('#editBudgetModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var budgetId = button.data('id');
    var subcategoryId = button.data('subcategory');
    var amount = button.data('amount');
    var startDate = button.data('start_date');
    var endDate = button.data('end_date');
    var duration = button.data('duration');
    
    var modal = $(this);
    clearFormErrors(modal.find('form'));
    
    modal.find('#budget_id').val(budgetId);
    modal.find('#id_subcategory').val(subcategoryId);
    modal.find('#id_amount').val(amount);
    modal.find('#id_start_date').val(startDate);
    modal.find('#id_end_date').val(endDate);
    modal.find('#id_duration').val(duration);
    
    // Select the subcategory in the visual selector
    modal.find('.subcategory-item').removeClass('selected');
    modal.find(`.subcategory-item[data-subcategory-id="${subcategoryId}"]`).addClass('selected');
    
    // Expand the parent category
    var selectedSubcategory = modal.find(`.subcategory-item[data-subcategory-id="${subcategoryId}"]`);
    var parentCategory = selectedSubcategory.closest('.category-item');
    parentCategory.find('.subcategories-container').addClass('show');
    parentCategory.find('.bi-chevron-right').removeClass('bi-chevron-right').addClass('bi-chevron-down');
});

// Hide subcategory select and show custom selector
$(document).ready(function() {
    // Hide the original subcategory select
    $('#id_subcategory').hide();
});