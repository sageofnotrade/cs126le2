/**
 * Budget Tracker Chart Utilities
 * Contains helper functions for creating and managing charts
 */

// Colors for pie/donut charts
const CHART_COLORS = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
    '#FF9F40', '#C9CBCF', '#7BC225', '#B56DB4', '#E67E22'
];

/**
 * Creates a pie chart with the provided data
 * 
 * @param {string} elementId - The ID of the canvas element
 * @param {Array} data - Array of objects with category and amount properties
 * @param {Object} options - Optional chart configuration options
 * @returns {Chart} The created chart instance
 */
function createPieChart(elementId, data, options = {}) {
    const ctx = document.getElementById(elementId).getContext('2d');
    
    if (!data || data.length === 0) {
        document.getElementById(elementId).parentNode.innerHTML = 
            '<div class="text-center p-5">' +
            '<p class="text-muted">No data available for this period.</p>' +
            '</div>';
        return null;
    }
    
    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: data.map(item => item.category),
            datasets: [{
                data: data.map(item => item.amount),
                backgroundColor: CHART_COLORS,
                borderWidth: 1
            }]
        },
        options: Object.assign({
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }, options)
    });
}

/**
 * Creates a bar chart for income vs expenses
 * 
 * @param {string} elementId - The ID of the canvas element
 * @param {Array} labels - Array of month/date labels
 * @param {Array} incomeData - Array of income values
 * @param {Array} expenseData - Array of expense values
 * @param {Object} options - Optional chart configuration options
 * @returns {Chart} The created chart instance
 */
function createIncomeExpenseChart(elementId, labels, incomeData, expenseData, options = {}) {
    const ctx = document.getElementById(elementId).getContext('2d');
    
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: '#4BC0C0',
                    borderColor: '#4BC0C0',
                    borderWidth: 1
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: '#FF6384',
                    borderColor: '#FF6384',
                    borderWidth: 1
                }
            ]
        },
        options: Object.assign({
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }, options)
    });
} 