# Kayako - Personal Finance Manager

Kayako is a web-based personal finance management application designed specifically for Filipino users to track expenses, manage budgets, and gain insights into their financial habits.

![Kayako Dashboard](static/img/dashboard_preview.png)

## Features

### Dashboard
- **Financial Overview**: Get a snapshot of your accounts, current month's income/expenses, and previous month's summary
- **Customizable Widgets**: Personalize your dashboard with widgets for budgets, upcoming transactions, expense categories, and balance projections
- **Budget Warnings**: Receive alerts when you're approaching budget limits

### Transaction Management
- **Track Expenses & Income**: Log all financial transactions with detailed information
- **Categorization**: Organize transactions by category and subcategory
- **Transaction History**: View, edit, and analyze your complete transaction history

### Budget Management
- **Create Budgets**: Set up weekly and monthly budgets by category
- **Budget Tracking**: Monitor spending against your budgets
- **Visual Progress**: See percentage-based progress bars for each budget

### Scheduled Transactions
- **Future Planning**: Schedule upcoming transactions (bills, income, etc.)
- **Recurring Transactions**: Set up transactions that repeat on a schedule
- **Auto-Renewal**: Automatically renew recurring budgets when they expire

### Accounts
- **Multiple Account Types**: Support for debit accounts, credit accounts, and wallets
- **Balance Tracking**: Monitor balances across all your accounts
- **Account Summary**: See total available balance across all accounts

### Debt Management
- **Track Debts**: Keep records of money you owe or are owed
- **Payment Planning**: Set payback dates and track progress
- **Visual Indicators**: See clear status of all outstanding debts

### Financial Analytics
- **Visual Charts**: Analyze spending patterns with interactive charts
- **Category Breakdown**: See where your money goes by category
- **Time-based Analysis**: View trends over time (daily, weekly, monthly)
- **Future Projections**: Get insights into future financial situations

### Custom Categories
- **Personalized Categories**: Create and manage custom categories for your transactions
- **Subcategories**: Further organize with subcategories
- **Hierarchy Management**: Reorder and restructure your categories as needed

## Installation and Setup

### Prerequisites
- Python 3.8 or higher
- Django 4.0 or higher
- Other dependencies listed in requirements.txt

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/kayako.git
   cd kayako
   ```

2. **Create and activate a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run migrations**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (admin)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the development server**
   ```bash
   python manage.py runserver
   ```

7. **Access the application**
   - Open your browser and navigate to: http://127.0.0.1:8000/
   - Admin interface: http://127.0.0.1:8000/admin/

## Usage Guide

### Getting Started
1. **Create an account** or log in to your existing account
2. **Set up your accounts** (debit, credit, wallet) with initial balances
3. **Define categories** that match your spending habits
4. **Create budgets** for different spending categories
5. **Start logging transactions** to track your expenses and income

### Regular Activities
- **Daily**: Log your transactions to keep your financial data up-to-date
- **Weekly**: Review your budget progress and adjust spending if needed
- **Monthly**: Analyze your spending patterns and set up new budgets

### Advanced Features
- Use **scheduled transactions** for recurring bills and income
- Set up **debt tracking** for personal loans
- Explore **charts** to gain deeper insights into your finances
- Customize your **dashboard** with the widgets most relevant to you

## Technologies Used
- **Backend**: Django, Python
- **Frontend**: HTML, CSS, JavaScript, Bootstrap
- **Data Visualization**: Chart.js
- **Interactive UI**: jQuery, Bootstrap
- **Database**: SQLite (default), compatible with PostgreSQL

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements
- Developed at UP Cebu
- Designed for everyday Filipinos to manage personal finances
- Special thanks to all contributors and testers


Project Tasks Documentation Link: https://docs.google.com/spreadsheets/d/13OM6G5GT2l6nmqQtcQljqQ9Wp90smUMQRjqnk08zAXA/edit?usp=sharing