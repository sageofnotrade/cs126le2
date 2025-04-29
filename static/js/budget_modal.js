// Initialize Bootstrap components
document.addEventListener('DOMContentLoaded', function() {
    // No need to manually initialize modals in Bootstrap 5
});

// Function to display form errors
function displayFormErrors(form, errors) {
    // Clear previous errors
    form.find('.invalid-feedback').remove();
    form.find('.is-invalid').removeClass('is-invalid');
    
    // Display new errors
    Object.keys(errors).forEach(function(field) {
        const input = form.find(`#id_${field}`);
        input.addClass('is-invalid');
        const errorDiv = $('<div class="invalid-feedback"></div>');
        errorDiv.text(errors[field].join(' '));
        input.after(errorDiv);
    });
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

// Handle Add Budget Form Submission
$('#addBudgetForm').submit(function(e) {
    e.preventDefault();
    var form = $(this);
    var formData = form.serialize();
    
    $.ajax({
        url: '/finances/budget/add/',
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                // Reload the page to show the new budget
                window.location.reload();
            } else {
                if (response.errors) {
                    displayFormErrors(form, response.errors);
                } else {
                    alert('There was an error adding the budget');
                }
            }
        },
        error: function() {
            alert('There was an error connecting to the server');
        }
    });
});

// Handle Edit Budget Modal
$('#editBudgetModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var budgetId = button.data('id');
    var category = button.data('category');
    var amount = button.data('amount');
    var startDate = button.data('start_date');
    var endDate = button.data('end_date');
    var duration = button.data('duration');
    
    var modal = $(this);
    clearFormErrors(modal.find('form'));
    
    modal.find('#budget_id').val(budgetId);
    modal.find('#id_category').val(category);
    modal.find('#id_amount').val(amount);
    modal.find('#id_start_date').val(startDate);
    modal.find('#id_end_date').val(endDate);
    modal.find('#id_duration').val(duration);
});

// Handle Edit Budget Form Submission
$('#editBudgetForm').submit(function(e) {
    e.preventDefault();
    var form = $(this);
    var formData = form.serialize();
    
    $.ajax({
        url: '/finances/budget/update/',
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                // Reload the page to show the updated budget
                window.location.reload();
            } else {
                if (response.errors) {
                    displayFormErrors(form, response.errors);
                } else {
                    alert('There was an error updating the budget');
                }
            }
        },
        error: function() {
            alert('There was an error connecting to the server');
        }
    });
});

// Handle Delete Budget Modal
$('#deleteBudgetModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);
    var budgetId = button.data('id');
    var modal = $(this);
    modal.find('#delete_budget_id').val(budgetId);
});

// Handle Delete Budget Form Submission
$('#deleteBudgetForm').submit(function(e) {
    e.preventDefault();
    var form = $(this);
    var formData = form.serialize();
    
    $.ajax({
        url: '/finances/budget/delete/',
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                // Reload the page to show the budget has been deleted
                window.location.reload();
            } else {
                alert(response.error || 'There was an error deleting the budget');
            }
        },
        error: function() {
            alert('There was an error connecting to the server');
        }
    });
});