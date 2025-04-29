from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login, logout
from datetime import timedelta
import calendar
import csv
import json
from .models import Transaction, Category, Budget, Account, DebitAccount, CreditAccount, Wallet, SubCategory
from .forms import TransactionForm, CategoryForm, BudgetForm, DateRangeForm, DebitAccountForm, CreditAccountForm, WalletForm, SubCategoryForm
from django import forms
from django.contrib.auth.models import User
import logging

def home(request):
    return render(request, 'finances/home.html')

class CustomUserCreationForm(UserCreationForm):
    email = forms.EmailField(required=True)
    
    class Meta:
        model = User
        fields = ("username", "email", "password1", "password2")
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.email = self.cleaned_data["email"]
        if commit:
            user.save()
        return user

def signup(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, f'Account created successfully! Welcome to Budget Tracker.')
            return redirect('dashboard')
    else:
        form = CustomUserCreationForm()
    return render(request, 'registration/signup.html', {'form': form})

@login_required
def accounts_list(request):
    account_types = ['Debit', 'Credit', 'Wallet']

    debit_accounts = DebitAccount.objects.filter(user=request.user)
    credit_accounts = CreditAccount.objects.filter(user=request.user)
    wallet_accounts = Wallet.objects.filter(user=request.user)

    accounts = {
        'Debit': debit_accounts,
        'Credit': credit_accounts,
        'Wallet': wallet_accounts,
    }

    if request.method == 'POST':
        account_type = request.POST.get('account_type')

        form_classes = {
            'Debit': DebitAccountForm,
            'Credit': CreditAccountForm,
            'Wallet': WalletForm,
        }

        form_class = form_classes.get(account_type)
        form = form_class(request.POST)

        if form.is_valid():
            new_account = form.save(commit=False)
            new_account.user = request.user

            # Validation logic for Debit accounts
            if account_type == 'Debit':
                balance = form.cleaned_data.get('balance')
                maintaining_balance = form.cleaned_data.get('maintaining_balance')

                if maintaining_balance and balance < maintaining_balance:
                    messages.error(request, "Balance must be greater than or equal to the maintaining balance.")
                    return redirect('accounts_list')

            # Validation logic for Credit accounts
            if account_type == 'Credit':
                current_usage = form.cleaned_data.get('current_usage')
                credit_limit = form.cleaned_data.get('credit_limit')

                if current_usage > credit_limit:
                    messages.error(request, "Current usage cannot exceed the credit limit.")
                    return redirect('accounts_list')

            new_account.save()
            messages.success(request, f'{account_type} account created successfully!')
            return redirect('accounts_list')
        else:
            messages.error(request, 'Please correct the errors below.')
    else:
        form = DebitAccountForm()

    context = {
        'accounts': accounts,
        'account_types': account_types,
        'form': form,
    }

    return render(request, 'finances/accounts.html', context)

@login_required
def delete_account(request, account_id):
    account = get_object_or_404(Account, id=account_id, user=request.user)
    account.delete()
    return redirect('accounts_list')

@login_required
def dashboard(request):
    today = timezone.now().date()
    first_day = today.replace(day=1)
    last_day = today.replace(day=calendar.monthrange(today.year, today.month)[1])
    
    income = Transaction.objects.filter(
        user=request.user,
        type='income',
        date__gte=first_day,
        date__lte=last_day
    ).aggregate(Sum('amount'))['amount__sum'] or 0
    
    expenses = Transaction.objects.filter(
        user=request.user,
        type='expense',
        date__gte=first_day,
        date__lte=last_day
    ).aggregate(Sum('amount'))['amount__sum'] or 0
    
    balance = income - expenses
    
    recent_transactions = Transaction.objects.filter(
        user=request.user
    ).order_by('-date')[:5]
    
    # Get expenses by category for pie chart
    categories = Category.objects.filter(user=request.user)
    expenses_by_category = []
    
    for category in categories:
        amount = Transaction.objects.filter(
            user=request.user,
            type='expense',
            category=category,
            date__gte=first_day,
            date__lte=last_day
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        if amount > 0:
            expenses_by_category.append({
                'category': category.name,
                'amount': float(amount)
            })
    
    # Budget warnings
    budgets = Budget.objects.filter(user=request.user, month__year=today.year, month__month=today.month)
    budget_warnings = []
    
    for budget in budgets:
        spent = Transaction.objects.filter(
            user=request.user,
            type='expense',
            category=budget.category,
            date__gte=first_day,
            date__lte=last_day
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        if spent > budget.amount:
            budget_warnings.append({
                'category': budget.category.name,
                'budget': float(budget.amount),
                'spent': float(spent),
                'percentage': round((spent / budget.amount) * 100)
            })
    
    context = {
        'income': income,
        'expenses': expenses,
        'balance': balance,
        'recent_transactions': recent_transactions,
        'expenses_by_category': json.dumps(expenses_by_category),
        'budget_warnings': budget_warnings
    }
    
    return render(request, 'finances/dashboard.html', context)

@login_required
def add_transaction(request):
    if request.method == 'POST':
        form = TransactionForm(request.POST, user=request.user)
        if form.is_valid():
            transaction = form.save(commit=False)
            transaction.user = request.user
            transaction.save()
            messages.success(request, 'Transaction added successfully.')
            return redirect('dashboard')
    else:
        form = TransactionForm(user=request.user)
    
    return render(request, 'finances/transaction_form.html', {'form': form, 'title': 'Add Transaction'})

@login_required
def edit_transaction(request, pk):
    transaction = get_object_or_404(Transaction, pk=pk, user=request.user)
    
    if request.method == 'POST':
        form = TransactionForm(request.POST, instance=transaction, user=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Transaction updated successfully.')
            return redirect('dashboard')
    else:
        form = TransactionForm(instance=transaction, user=request.user)
    
    return render(request, 'finances/transaction_form.html', {'form': form, 'title': 'Edit Transaction'})

@login_required
def delete_transaction(request, pk):
    transaction = get_object_or_404(Transaction, pk=pk, user=request.user)
    
    if request.method == 'POST':
        transaction.delete()
        messages.success(request, 'Transaction deleted successfully.')
        return redirect('dashboard')
    
    return render(request, 'finances/transaction_confirm_delete.html', {'transaction': transaction})

@login_required
def reports_view(request):
    return render(request, 'reports.html')
    
@login_required
def monthly_summary(request):
    if request.method == 'POST':
        form = DateRangeForm(request.POST)
        if form.is_valid():
            start_date = form.cleaned_data['start_date']
            end_date = form.cleaned_data['end_date']
        else:
            today = timezone.now().date()
            start_date = today.replace(day=1)
            end_date = today
    else:
        today = timezone.now().date()
        start_date = today.replace(day=1)
        end_date = today
        form = DateRangeForm(initial={'start_date': start_date, 'end_date': end_date})
    
    # Get all transactions within the date range
    transactions = Transaction.objects.filter(
        user=request.user,
        date__gte=start_date,
        date__lte=end_date
    ).order_by('-date')
    
    # Calculate totals
    income = Transaction.objects.filter(
        user=request.user,
        type='income',
        date__gte=start_date,
        date__lte=end_date
    ).aggregate(Sum('amount'))['amount__sum'] or 0
    
    expenses = Transaction.objects.filter(
        user=request.user,
        type='expense',
        date__gte=start_date,
        date__lte=end_date
    ).aggregate(Sum('amount'))['amount__sum'] or 0
    
    # Get expenses by category for pie chart
    categories = Category.objects.filter(user=request.user)
    expenses_by_category = []
    
    for category in categories:
        amount = Transaction.objects.filter(
            user=request.user,
            type='expense',
            category=category,
            date__gte=start_date,
            date__lte=end_date
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        if amount > 0:
            expenses_by_category.append({
                'category': category.name,
                'amount': float(amount)
            })
    
    context = {
        'form': form,
        'transactions': transactions,
        'income': income,
        'expenses': expenses,
        'balance': income - expenses,
        'expenses_by_category': json.dumps(expenses_by_category),
        'start_date': start_date,
        'end_date': end_date
    }
    
    return render(request, 'finances/monthly_summary.html', context)

@login_required
def categories(request):
    """View to manage categories, works with both Django forms and React frontend"""
    
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            category = form.save(commit=False)
            category.user = request.user
            category.save()
            
            # If AJAX request, return JSON response
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'category': {
                        'id': category.id,
                        'name': category.name,
                        'icon': category.icon
                    }
                })
            
            messages.success(request, 'Category added successfully.')
            return redirect('categories')
        else:
            # If AJAX request, return error response
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'errors': form.errors
                }, status=400)
    else:
        form = CategoryForm(initial={'icon': 'bi-tag'})
    
    categories = Category.objects.filter(user=request.user)
    
    # Get available icon options for the form
    available_icons = [
        { 'icon': 'bi-tag', 'name': 'Tag' },
        { 'icon': 'bi-cash-coin', 'name': 'Cash' },
        { 'icon': 'bi-credit-card', 'name': 'Credit Card' },
        { 'icon': 'bi-cart', 'name': 'Shopping Cart' },
        { 'icon': 'bi-bag', 'name': 'Shopping Bag' },
        { 'icon': 'bi-truck', 'name': 'Transportation' },
        { 'icon': 'bi-house', 'name': 'Home' },
        { 'icon': 'bi-cup-hot', 'name': 'Food' },
        { 'icon': 'bi-music-note-beamed', 'name': 'Entertainment' },
        { 'icon': 'bi-people', 'name': 'Family' },
        { 'icon': 'bi-heart-pulse', 'name': 'Health' },
        { 'icon': 'bi-graph-up-arrow', 'name': 'Investments' },
        { 'icon': 'bi-gift', 'name': 'Gift' },
        { 'icon': 'bi-airplane', 'name': 'Travel' },
        { 'icon': 'bi-book', 'name': 'Education' },
        { 'icon': 'bi-lightning', 'name': 'Utilities' }
    ]
    
    context = {
        'form': form,
        'categories': categories,
        'available_icons': available_icons
    }
    
    return render(request, 'finances/categories.html', context)

@login_required
def export_csv(request):
    if request.method == 'POST':
        form = DateRangeForm(request.POST)
        if form.is_valid():
            start_date = form.cleaned_data['start_date']
            end_date = form.cleaned_data['end_date']
            
            # Get all transactions within the date range
            transactions = Transaction.objects.filter(
                user=request.user,
                date__gte=start_date,
                date__lte=end_date
            ).order_by('-date')
            
            # Create CSV response
            response = HttpResponse(content_type='text/csv')
            response['Content-Disposition'] = f'attachment; filename="transactions_{start_date}_{end_date}.csv"'
            
            writer = csv.writer(response)
            writer.writerow(['Title', 'Amount', 'Date', 'Type', 'Category', 'Notes'])
            
            for transaction in transactions:
                category_name = transaction.category.name if transaction.category else 'Uncategorized'
                writer.writerow([
                    transaction.title,
                    transaction.amount,
                    transaction.date,
                    transaction.type,
                    category_name,
                    transaction.notes or ''
                ])
            
            return response
    else:
        today = timezone.now().date()
        start_date = today.replace(day=1)
        end_date = today
        form = DateRangeForm(initial={'start_date': start_date, 'end_date': end_date})
    
    return render(request, 'finances/export_csv.html', {'form': form})

@login_required
def manage_budget(request):
    if request.method == 'POST':
        form = BudgetForm(request.POST, user=request.user)
        if form.is_valid():
            budget = form.save(commit=False)
            budget.user = request.user
            
            # Handle the case where a budget for this category and month already exists
            existing_budget = Budget.objects.filter(
                user=request.user,
                category=budget.category,
                month__year=budget.month.year,
                month__month=budget.month.month
            ).first()
            
            if existing_budget:
                existing_budget.amount = budget.amount
                existing_budget.save()
                messages.success(request, 'Budget updated successfully.')
            else:
                budget.save()
                messages.success(request, 'Budget added successfully.')
            
            return redirect('manage_budget')
    else:
        form = BudgetForm(user=request.user)
    
    today = timezone.now().date()
    budgets = Budget.objects.filter(
        user=request.user,
        month__year=today.year,
        month__month=today.month
    )
    
    budget_data = []
    for budget in budgets:
        spent = Transaction.objects.filter(
            user=request.user,
            type='expense',
            category=budget.category,
            date__year=today.year,
            date__month=today.month
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        percentage = round((spent / budget.amount) * 100) if budget.amount > 0 else 0
        
        budget_data.append({
            'category': budget.category.name,
            'budget': budget.amount,
            'spent': spent,
            'remaining': budget.amount - spent,
            'percentage': percentage
        })
    
    return render(request, 'finances/manage_budget.html', {'form': form, 'budgets': budget_data})

def custom_logout(request):
    logout(request)
    messages.success(request, 'You have been successfully logged out.')
    return redirect('home')

@login_required
def api_categories(request):
    """API endpoint to get categories"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    logger = logging.getLogger(__name__)
    
    # Get all categories for the user
    categories = Category.objects.filter(user=request.user)
    logger.info(f"User {request.user.username} has {categories.count()} categories")
    
    income_categories = []
    expense_categories = []
    
    for category in categories:
        try:
            # Get subcategories for each category with explicit query to ensure they're loaded
            subcategories = list(SubCategory.objects.filter(parent_category=category).values('id', 'name', 'icon'))
            logger.info(f"Category {category.name} has {len(subcategories)} subcategories")
            
            category_data = {
                'id': category.id,
                'name': category.name,
                'icon': category.icon,
                'subcategories': subcategories
            }
            
            # Simple classification based on icon for now
            if 'cash' in category.icon or 'graph' in category.icon:
                income_categories.append(category_data)
            else:
                expense_categories.append(category_data)
        except Exception as e:
            # Log the error but continue with other categories
            logger.error(f"Error processing category {category.name}: {str(e)}")
            continue
    
    # Get list of Bootstrap icons
    available_icons = get_available_icons()
    
    response_data = {
        'income': income_categories,
        'expenses': expense_categories,
        'availableIcons': available_icons
    }
    
    # Log sample of the response for debugging
    if income_categories:
        logger.info(f"Sample income category: {income_categories[0]['name']} with {len(income_categories[0]['subcategories'])} subcategories")
    if expense_categories:
        logger.info(f"Sample expense category: {expense_categories[0]['name']} with {len(expense_categories[0]['subcategories'])} subcategories")
    
    return JsonResponse(response_data)

def api_add_category(request):
    """API endpoint to add a category"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'}, status=400)
    
    form = CategoryForm(request.POST)
    if form.is_valid():
        category = form.save(commit=False)
        category.user = request.user
        category.save()
        
        return JsonResponse({
            'success': True,
            'category': {
                'id': category.id,
                'name': category.name,
                'icon': category.icon,
                'subcategories': []
            }
        })
    else:
        return JsonResponse({'error': 'Invalid form data', 'errors': form.errors}, status=400)

# API endpoint for getting subcategories of a specific category
def api_subcategories(request, category_id):
    """API endpoint to get subcategories for a specific category"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    try:
        category = Category.objects.get(id=category_id, user=request.user)
    except Category.DoesNotExist:
        return JsonResponse({'error': 'Category not found'}, status=404)
    
    subcategories = list(SubCategory.objects.filter(parent_category=category).values('id', 'name', 'icon'))
    
    return JsonResponse({
        'subcategories': subcategories
    })

# API endpoint for adding a subcategory
def api_add_subcategory(request, category_id):
    """API endpoint to add a subcategory to a category"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'}, status=400)
    
    try:
        category = Category.objects.get(id=category_id, user=request.user)
    except Category.DoesNotExist:
        return JsonResponse({'error': 'Category not found'}, status=404)
    
    form = SubCategoryForm(request.POST, user=request.user, category_id=category_id)
    if form.is_valid():
        subcategory = form.save(commit=False)
        subcategory.parent_category = category
        subcategory.save()
        
        return JsonResponse({
            'success': True,
            'subcategory': {
                'id': subcategory.id,
                'name': subcategory.name,
                'icon': subcategory.icon
            }
        })
    else:
        return JsonResponse({'error': 'Invalid form data', 'errors': form.errors}, status=400)

# API endpoint for deleting a subcategory
def api_delete_subcategory(request, subcategory_id):
    """API endpoint to delete a subcategory"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if request.method != 'DELETE':
        return JsonResponse({'error': 'DELETE request required'}, status=400)
    
    try:
        subcategory = SubCategory.objects.get(id=subcategory_id, parent_category__user=request.user)
        subcategory.delete()
        return JsonResponse({'success': True})
    except SubCategory.DoesNotExist:
        return JsonResponse({'error': 'Subcategory not found'}, status=404)

# API endpoint for updating a subcategory
def api_update_subcategory(request, subcategory_id):
    """API endpoint to update a subcategory"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if request.method != 'POST':
        return JsonResponse({'error': 'POST request required'}, status=400)
    
    try:
        subcategory = SubCategory.objects.get(id=subcategory_id, parent_category__user=request.user)
        
        # Update subcategory fields
        name = request.POST.get('name', '').strip()
        icon = request.POST.get('icon', subcategory.icon)
        
        if not name:
            return JsonResponse({'error': 'Subcategory name cannot be empty'}, status=400)
        
        subcategory.name = name
        subcategory.icon = icon
        subcategory.save()
        
        return JsonResponse({
            'success': True,
            'subcategory': {
                'id': subcategory.id,
                'name': subcategory.name,
                'icon': subcategory.icon
            }
        })
    except SubCategory.DoesNotExist:
        return JsonResponse({'error': 'Subcategory not found'}, status=404)

# API endpoint for deleting a category
def api_delete_category(request, category_id):
    """API endpoint to delete a category"""
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)
    
    if request.method != 'DELETE':
        return JsonResponse({'error': 'DELETE request required'}, status=400)
    
    try:
        category = Category.objects.get(id=category_id, user=request.user)
        
        # Delete the category (this will also delete all subcategories due to CASCADE)
        category.delete()
        return JsonResponse({'success': True})
    except Category.DoesNotExist:
        return JsonResponse({'error': 'Category not found'}, status=404)

def get_icon_for_category(category_name):
    """Get a suitable icon for a category based on its name"""
    category_name = category_name.lower()
    
    if any(word in category_name for word in ['salary', 'income', 'wage']):
        return 'bi-cash-coin'
    elif any(word in category_name for word in ['invest', 'stock', 'dividend', 'return']):
        return 'bi-graph-up-arrow'
    elif any(word in category_name for word in ['food', 'grocery', 'restaurant', 'dining']):
        return 'bi-cup-hot'
    elif any(word in category_name for word in ['transport', 'fuel', 'car', 'bus', 'train']):
        return 'bi-truck'
    elif any(word in category_name for word in ['house', 'rent', 'mortgage', 'property']):
        return 'bi-house'
    elif any(word in category_name for word in ['health', 'medical', 'doctor', 'medicine']):
        return 'bi-heart-pulse'
    elif any(word in category_name for word in ['gift', 'present', 'donation']):
        return 'bi-gift'
    elif any(word in category_name for word in ['shop', 'purchase', 'buy']):
        return 'bi-cart'
    elif any(word in category_name for word in ['bill', 'utility', 'electric', 'water', 'gas']):
        return 'bi-lightning'
    elif any(word in category_name for word in ['education', 'school', 'learn', 'course', 'book']):
        return 'bi-book'
    elif any(word in category_name for word in ['travel', 'holiday', 'vacation', 'trip']):
        return 'bi-airplane'
    elif any(word in category_name for word in ['entertainment', 'movie', 'game', 'fun']):
        return 'bi-music-note-beamed'
    
    # Default icon
    return 'bi-tag'

def get_available_icons():
    """Return list of available Bootstrap icons for categories"""
    return [
        { 'icon': 'bi-tag', 'name': 'Tag' },
        { 'icon': 'bi-tag-fill', 'name': 'Tag (Filled)' },
        { 'icon': 'bi-cash-coin', 'name': 'Cash' },
        { 'icon': 'bi-credit-card', 'name': 'Credit Card' },
        { 'icon': 'bi-cart', 'name': 'Shopping Cart' },
        { 'icon': 'bi-bag', 'name': 'Shopping Bag' },
        { 'icon': 'bi-truck', 'name': 'Transportation' },
        { 'icon': 'bi-house', 'name': 'Home' },
        { 'icon': 'bi-cup-hot', 'name': 'Food' },
        { 'icon': 'bi-music-note-beamed', 'name': 'Entertainment' },
        { 'icon': 'bi-people', 'name': 'Family' },
        { 'icon': 'bi-heart-pulse', 'name': 'Health' },
        { 'icon': 'bi-graph-up-arrow', 'name': 'Investments' },
        { 'icon': 'bi-gift', 'name': 'Gift' },
        { 'icon': 'bi-airplane', 'name': 'Travel' },
        { 'icon': 'bi-book', 'name': 'Education' },
        { 'icon': 'bi-lightning', 'name': 'Utilities' }
    ]