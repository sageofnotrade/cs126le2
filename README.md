# Budget Tracker Application

A comprehensive web application for tracking personal finances, built with Django and React.

## Project Overview

This application allows users to:
- Track income and expenses
- Categorize transactions
- Set and monitor budgets
- View financial summaries with visualizations
- Export financial data

## Setup Instructions

1. **Clone the repository**

2. **Install dependencies**
   ```
   pip install -r requirements.txt
   cd frontend && npm install
   ```

3. **Setup the database**
   ```
   python manage.py migrate
   ```

4. **Run the application**
   ```
   # Run Django backend
   python manage.py runserver
   
   # In a separate terminal, compile frontend assets
   cd frontend && npm run dev
   ```

## Project Structure

### Core Directories

- `budget_tracker/` - Main Django project directory with settings
- `finances/` - Main Django app with models, views, and forms
- `templates/` - HTML templates
- `static/` - Static files (CSS, JavaScript, images)
- `frontend/` - React frontend components
- `media/` - User-uploaded files (if applicable)

## Key Files and Components

### Configuration and Setup

- `budget_tracker/settings.py` - Django settings including database, static files, and installed apps
- `budget_tracker/urls.py` - Main URL routing
- `requirements.txt` - Python dependencies

### Backend Components

- `finances/models.py` - Database models for Transaction, Category, Budget
- `finances/views.py` - View functions for all major functionality
- `finances/forms.py` - Form definitions for user input
- `finances/urls.py` - App-specific URLs

### Frontend Templates

- `templates/base.html` - Base layout template
- `templates/finances/dashboard.html` - Main dashboard view
- `templates/finances/transaction_form.html` - Form for adding/editing transactions
- `templates/finances/monthly_summary.html` - Monthly financial summary
- `templates/finances/categories.html` - Category management
- `templates/finances/manage_budget.html` - Budget management
- `templates/finances/export_csv.html` - Data export interface
- `templates/registration/login.html` - Login page
- `templates/finances/register.html` - Registration page

### React Components

- `frontend/src/components/HomePage.js` - Landing page main component
- `frontend/src/components/Hero.js` - Hero section of landing page
- `frontend/src/components/Features.js` - Features section of landing page 
- `frontend/src/components/Testimonial.js` - Testimonials section
- `frontend/src/components/CallToAction.js` - CTA section

### Static Files

- `static/css/homepage.css` - CSS for the landing page
- `static/img/` - Images used in the app
- `frontend/static/` - Compiled frontend assets

## Authentication System

The application uses Django's built-in authentication system with crispy forms for a modern UI:
- Login URL: `/accounts/login/`
- Registration URL: `/register/`
- Uses crispy-bootstrap5 for form styling and layout

## Main Features

### Dashboard (`/dashboard/`)
Central hub showing financial overview with:
- Income/expense summary
- Recent transactions
- Expense breakdown chart
- Budget warnings
- Quick action links

### Transaction Management
- Add transaction (`/finances/add/`)
- Edit transaction (`/finances/edit/<id>/`)
- Delete transaction (`/finances/delete/<id>/`)

### Reporting and Analysis
- Monthly summary (`/finances/summary/`)
- Export data as CSV (`/finances/export/`)

### Category Management
- Create and manage categories (`/finances/categories/`)

### Budget Management
- Set and monitor budgets (`/finances/budget/`)

## Technologies Used

- **Backend**: Django 5.2
- **Frontend**: React, Bootstrap 5
- **Database**: SQLite (default)
- **Charts**: Chart.js
- **Forms**: django-crispy-forms, crispy-bootstrap5
- **Icons**: Bootstrap Icons
- **API**: Django REST framework

## Common Development Tasks

### Adding a New Feature
1. Create/modify the model in `finances/models.py`
2. Create a form in `finances/forms.py` if needed
3. Add view function in `finances/views.py`
4. Create template in `templates/finances/`
5. Add URL route in `finances/urls.py`

### Styling Changes
1. Global styles are in `templates/base.html`
2. Page-specific styles are in respective template files
3. Homepage styles are in `static/css/homepage.css`

### Frontend React Components
1. Frontend source files are in `frontend/src/`
2. After changes, run `npm run dev` in the frontend directory
3. Compiled output goes to `frontend/static/`