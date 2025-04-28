// Populate the modal with budget data when the edit button is clicked
$('#editBudgetModal').on('show.bs.modal', function (event) {
    var button = $(event.relatedTarget);  // Button that triggered the modal
    var budgetId = button.data('id');
    var category = button.data('category');
    var amount = button.data('amount');
    var startDate = button.data('start_date');
    var endDate = button.data('end_date');
    
    var modal = $(this);
    modal.find('#budget_id').val(budgetId);
    modal.find('#category').val(category);
    modal.find('#amount').val(amount);
    modal.find('#start_date').val(startDate);
    modal.find('#end_date').val(endDate);
});

// Handle form submission via AJAX
$('#editBudgetForm').submit(function(e) {
    e.preventDefault();  // Prevent the form from submitting normally
    
    var formData = $(this).serialize();  // Get form data
    
    $.ajax({
        url: '/finances/budget/update/',  // URL to handle the update
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                // Find the row with the corresponding budget ID and update the table row dynamically
                var updatedBudget = response.updatedBudget;  // Assuming the server returns the updated budget
                var budgetRow = $('#budget-row-' + updatedBudget.id);  // Find the row by ID
                budgetRow.find('.category').text(updatedBudget.category);
                budgetRow.find('.amount').text(updatedBudget.amount);
                budgetRow.find('.start_date').text(updatedBudget.start_date);
                budgetRow.find('.end_date').text(updatedBudget.end_date);
                budgetRow.find('.percentage').text(updatedBudget.percentage_used + '%');

                // Close the modal
                $('#editBudgetModal').modal('hide');
            } else {
                alert('There was an error updating the budget');
            }
        }
    });
});