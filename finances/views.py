from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Q, F, ExpressionWrapper, DecimalField, Avg
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth import login, logout, authenticate
from datetime import timedelta, datetime
import calendar
import csv
import json
from .models import Transaction, Category, Budget, Account, DebitAccount, CreditAccount, Wallet, SubCategory, Debt, ScheduledTransaction
from .forms import TransactionForm, CategoryForm, BudgetForm, DateRangeForm, DebitAccountForm, CreditAccountForm, WalletForm, SubCategoryForm, DebtForm, ScheduledTransactionForm
from django import forms
from django.contrib.auth.models import User
import logging
from django.db import models
from decimal import Decimal

def home(request):
    return render(request, 'finances/home.html')

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'Welcome back, {username}!')
                return redirect('dashboard')
            else:
                messages.error(request, 'Invalid username or password.')
        else:
            messages.error(request, 'Invalid username or password.')
    else:
        form = AuthenticationForm()
    return render(request, 'registration/login.html', {'form': form})

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
def scheduled_transactions(request):
    search_query = request.GET.get('search', '')
    month_str = request.GET.get('month', '')
    
    # Parse selected month or use current month
    if month_str:
        try:
            selected_month = datetime.strptime(month_str, '%Y-%m')
        except ValueError:
            selected_month = timezone.now()
    else:
        selected_month = timezone.now()
    
    # Get the first and last day of the selected month
    first_day = selected_month.replace(day=1)
    if selected_month.month == 12:
        last_day = selected_month.replace(year=selected_month.year + 1, month=1, day=1) - timezone.timedelta(days=1)
    else:
        last_day = selected_month.replace(month=selected_month.month + 1, day=1) - timezone.timedelta(days=1)
    
    # Get scheduled transactions
    scheduled_transactions = ScheduledTransaction.objects.filter(user=request.user)
    if search_query:
        scheduled_transactions = scheduled_transactions.filter(
            Q(name__icontains=search_query) | Q(note__icontains=search_query)
        )

    # Get actual transactions for the selected month
    actual_transactions = Transaction.objects.filter(
        user=request.user,
        date__range=[first_day, last_day]
    )

    # Calculate expected amounts for the selected month
    expected_income = 0
    expected_expense = 0
    monthly_transactions = []

    # Add actual transactions
    for transaction in actual_transactions:
        if transaction.type == 'income':
            expected_income += transaction.amount
        else:
            expected_expense += transaction.amount
        
        monthly_transactions.append({
            'date': transaction.date,
            'name': transaction.title,
            'type': transaction.type,
            'amount': transaction.amount,
            'is_scheduled': False
        })

    # Add scheduled transactions
    for scheduled in scheduled_transactions:
        # Get all occurrences for the selected month
        occurrences = scheduled.get_occurrences_for_month(selected_month.year, selected_month.month)
        
        for occurrence_date in occurrences:
            if scheduled.transaction_type == 'income':
                expected_income += scheduled.amount
            else:
                expected_expense += scheduled.amount
            
            monthly_transactions.append({
                'date': occurrence_date,
                'name': scheduled.name,
                'type': scheduled.transaction_type,
                'amount': scheduled.amount,
                'is_scheduled': True
            })

    # Sort transactions by date
    monthly_transactions.sort(key=lambda x: x['date'])

    # Calculate net
    net_sum = expected_income - expected_expense

    context = {
        'scheduled_transactions': scheduled_transactions,
        'monthly_transactions': monthly_transactions,
        'income_sum': expected_income,
        'expense_sum': expected_expense,
        'net_sum': net_sum,
        'search_query': search_query,
        'selected_month': selected_month,
    }

    return render(request, 'finances/scheduled_transactions.html', context)

@login_required
def create_scheduled_transaction(request):
    if request.method == 'POST':
        form = ScheduledTransactionForm(request.POST)

        if form.is_valid():
            new_transaction = form.save(commit=False)
            new_transaction.user = request.user
            new_transaction.save()

            messages.success(request, 'Scheduled transaction created successfully!')
            return redirect('scheduled_transactions')
        else:
            messages.error(request, 'There was an error with your input.')

    else:
        form = ScheduledTransactionForm()

    return render(request, 'finances/create_scheduled_transaction.html', {'form': form})

@login_required
def edit_scheduled_transaction(request, pk):
    scheduled_transaction = get_object_or_404(ScheduledTransaction, pk=pk, user=request.user)

    if request.method == 'POST':
        form = ScheduledTransactionForm(request.POST, instance=scheduled_transaction)

        if form.is_valid():
            form.save()
            messages.success(request, 'Scheduled transaction updated successfully!')
            return redirect('scheduled_transactions')
        else:
            messages.error(request, 'There was an error with your input.')

    else:
        form = ScheduledTransactionForm(instance=scheduled_transaction)

    return render(request, 'finances/create_scheduled_transaction.html', {'form': form})

@login_required
def delete_scheduled_transaction(request, pk):
    scheduled_transaction = get_object_or_404(ScheduledTransaction, pk=pk, user=request.user)

    if request.method == 'POST':
        scheduled_transaction.delete()
        messages.success(request, 'Scheduled transaction deleted successfully!')
        return redirect('scheduled_transactions')

    return render(request, 'finances/confirm_delete_scheduled_transaction.html', {'scheduled_transaction': scheduled_transaction})

@login_required
def debts_list(request):
    debts = Debt.objects.filter(user=request.user)

    debt_type = request.GET.get('type', '')
    search = request.GET.get('search', '')
    sort_by = request.GET.get('sort_by', 'date_issued')
    order = request.GET.get('order', 'asc')

    if debt_type:
        debts = debts.filter(debt_type=debt_type)
    
    if search:
        debts = debts.filter(
            Q(person__icontains=search) |
            Q(amount__icontains=search) |
            Q(notes__icontains=search)
        )

    account_filter = Q(user=request.user)
    
    debit_accounts = DebitAccount.objects.filter(account_filter)
    credit_accounts = CreditAccount.objects.filter(account_filter)
    wallet_accounts = Wallet.objects.filter(account_filter)
    
    # Combine the results in the context
    accounts = list(debit_accounts) + list(credit_accounts) + list(wallet_accounts)

    if sort_by == 'residual_amount':
        debts = debts.annotate(
            residual = ExpressionWrapper(
                F('amount') - F('paid'),
                output_field=DecimalField()
            )
        ).order_by('residual' if order == 'asc' else '-residual')
    else:
        if sort_by:
            debts = debts.order_by(sort_by)
            if order == 'desc':
                debts = debts.reverse()
                
    for debt in debts:
        debt.progress_percentage = (debt.paid / debt.amount) * 100 if debt.amount > 0 else 0
    
    context = {
        'debts': debts,
        'accounts': accounts,
    }

    return render(request, 'finances/debts.html', context)

@login_required
def add_debt(request):
    if request.method == 'POST':
        form = DebtForm(request.POST)

        if form.is_valid():
            new_debt = form.save(commit=False)
            new_debt.user = request.user
            new_debt.save()

            messages.success(request, 'Debt Entry created successfully!')
            return redirect('debts_list')
        else:
            messages.error(request, 'There was an error with your input.')
    else:
        form = DebtForm()
        
    return render(request, 'finances/add_debt.html', {'form': form})

@login_required
def edit_debt(request, pk):
    debt = get_object_or_404(Debt, pk=pk)
    
    if request.method == "POST":
        form = DebtForm(request.POST, instance=debt)
        if form.is_valid():
            form.save()
            return redirect('debts_list')
    else:
        form = DebtForm(instance=debt)
    
    return render(request, 'finances/edit_debt.html', {'form': form, 'debt': debt})

@login_required
def delete_debt(request, pk):
    debt = get_object_or_404(Debt, pk=pk)
    
    if request.method == "POST":
        debt.delete()
        return redirect('debts_list')
    
    return render(request, 'finances/confirm_delete_debt.html', {'debt': debt})

def update_payment(request, pk):
    debt = get_object_or_404(Debt, pk=pk)
    
    if request.method == 'POST':
        paid_amount = Decimal(request.POST.get('paid_amount'))
        account_id = request.POST.get('account')
        
        # account = None
        account3 = Wallet.objects.filter(id=account_id).first()
        account1 = DebitAccount.objects.filter(id=account_id).first()
        account2 = CreditAccount.objects.filter(id=account_id).first()
        
        if paid_amount > debt.residual_amount:
            messages.error(request, "The payment amount exceeds the residual amount.")
            return redirect('debts_list')        
        
        if account1:
            if (account1.balance - paid_amount) < account1.maintaining_balance:
                messages.error(request, "Balance after deduction is below the maintaining balance.")
                return redirect('debts_list')
            # account = account1
            if debt.debt_type.lower() == 'credit':
                account1.balance += paid_amount
            else:
                account1.balance -= paid_amount
            account1.save()
        elif account2:
            if debt.debt_type.lower() == 'credit':
                messages.error(request, "Credit accounts cannot accept payments for credit-type debts.")
                return redirect('debts_list')
            if (account2.current_usage + paid_amount) > account2.credit_limit:
                messages.error(request, "Payment exceeds credit limit.")
                return redirect('debts_list')
            # account = account2
            account2.current_usage += paid_amount
            account2.save()
        elif account3:
            if account3.balance < paid_amount:
                messages.error(request, "Insufficient balance in wallet.")
                return redirect('debts_list')
            # account = account3
            if debt.debt_type.lower() == 'credit':
                account3.balance += paid_amount
            else:
                account3.balance -= paid_amount
            account3.save()        
        else:
            messages.error(request, "Account not found.")
            return redirect('debts_list')
        
        debt.paid += paid_amount
        debt.save()
            
        Transaction.objects.create(
            title="Debt Payment",
            amount=paid_amount,
            type="expense" if debt.debt_type == 'debt' else "income",
            category=None,
            subcategory=None,
            user=request.user,
            notes=f"Payment for debt with {debt.person}",
            # account=account
        )

        messages.success(request, "Payment successfully updated!")
        return redirect('debts_list')
    
    return redirect('debts_list')

@login_required
def accounts_list(request):
    debit_accounts = DebitAccount.objects.filter(user=request.user)
    credit_accounts = CreditAccount.objects.filter(user=request.user)
    wallet_accounts = Wallet.objects.filter(user=request.user)

    total_debit_balance = sum(account.balance for account in debit_accounts)
    total_credit_balance = sum(account.credit_limit - account.current_usage for account in credit_accounts)
    total_wallet_balance = sum(account.balance for account in wallet_accounts)
    total_balance = total_debit_balance + total_credit_balance + total_wallet_balance
    
    account_types = ['Debit', 'Credit', 'Wallet']
    account_names = []
    account_balances = []
    
    for account in debit_accounts:
        account_names.append(account.name)
        account_balances.append(account.balance)

    for account in credit_accounts:
        account_names.append(account.name)
        account_balances.append(account.credit_limit - account.current_usage)

    for account in wallet_accounts:
        account_names.append(account.name)
        account_balances.append(account.balance)
    
    total_account_type_balance = {
        'Debit': total_debit_balance,
        'Credit': total_credit_balance,
        'Wallet': total_wallet_balance,
    }

    total_balance_by_type = [
        total_debit_balance,
        total_credit_balance,
        total_wallet_balance,
    ]

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
    
    chartdata = json.dumps({
        'total_balance': float(total_balance),
        'total_balance_by_type': [float(balance) for balance in total_balance_by_type],
        'account_names': account_names,
        'account_balances': [float(balance) for balance in account_balances],
    })

    context = {
        'account_types': account_types,
        'accounts': {
            'Debit': debit_accounts,
            'Credit': credit_accounts,
            'Wallet': wallet_accounts,
        },
        'chartdata': chartdata,
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
    budgets = Budget.objects.filter(user=request.user, start_date__year=today.year, end_date__month=today.month)
    budget_warnings = []
    
    for budget in budgets:
        spent = Transaction.objects.filter(
            user=request.user,
            type='expense',
            category=budget.category,
            date__gte=first_day,
            date__lte=last_day,
            transaction_account=budget.account
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
    form = BudgetForm(user=request.user)
    
    today = timezone.now().date()
    budgets = Budget.objects.select_related('category').filter(
        user=request.user,
        start_date__year=today.year,
        start_date__month=today.month
    )
    
    budget_data = []
    for budget in budgets:
        # Calculate the amount spent in this category for the current month
        spent = Transaction.objects.filter(
            user=request.user,
            type='expense',
            category=budget.category,
            date__year=today.year,
            date__month=today.month,
            transaction_account=budget.account
        ).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Calculate the remaining budget and the percentage used
        remaining = budget.amount - spent
        percentage = round((spent / budget.amount) * 100) if budget.amount > 0 else 0
        
        # Prepare the budget data to display
        budget_data.append({
            'id': budget.id,
            'category': budget.category,  # Pass the entire category object
            'budget': budget.amount,
            'spent': spent,
            'remaining': remaining,
            'percentage_used': percentage,
            'start_date': budget.start_date,
            'end_date': budget.end_date,
            'duration': budget.duration,
            'amount': budget.amount
        })
    
    return render(request, 'finances/manage_budget.html', {
        'form': form,
        'budgets': budget_data,
        'categories': Category.objects.filter(user=request.user)
    })

@login_required
def update_budget(request):
    if request.method == 'POST':
        budget_id = request.POST['budget_id']  # Get the budget ID from the form
        budget = get_object_or_404(Budget, id=budget_id)

        # Get form data
        category = Category.objects.get(id=request.POST['category'])
        amount = request.POST['amount']
        start_date = request.POST['start_date']
        end_date = request.POST['end_date']
        duration = request.POST['duration']

        # Update the budget with new values
        budget.category = category
        budget.amount = amount
        budget.start_date = start_date
        budget.end_date = end_date
        budget.duration = duration

        budget.save()

        # Return the updated budget data as JSON
        updated_budget = {
            'category': budget.category.name,
            'amount': budget.amount,
            'spent': budget.spent,
            'remaining': budget.remaining,
            'percentage': budget.percentage,
            'start_date': budget.start_date.strftime('%Y-%m-%d'),
            'end_date': budget.end_date.strftime('%Y-%m-%d')
        }
        return JsonResponse({'success': True, 'updatedBudget': updated_budget})

    return JsonResponse({'success': False})

def get_budgets(request):
    budgets = Budget.objects.all().values(
        'category', 'amount', 'spent', 'start_date', 'end_date', 'duration'
    )
    
    # Calculate 'remaining' dynamically for each budget
    budget_list = []
    for budget in budgets:
        budget['remaining'] = budget['amount'] - budget['spent']
        budget_list.append(budget)
    
    return JsonResponse(budget_list, safe=False)

def custom_logout(request):
    logout(request)
    messages.success(request, 'You have been successfully logged out.')
    return redirect('home')

@login_required
def add_budget(request):
    if request.method == 'POST':
        form = BudgetForm(request.POST, user=request.user)
        if form.is_valid():
            budget = form.save(commit=False)
            budget.user = request.user
            
            # Check for existing budget in the same period
            existing_budget = Budget.objects.filter(
                user=request.user,
                category=budget.category,
                start_date__year=budget.start_date.year,
                start_date__month=budget.start_date.month,
                account=budget.account
            ).first()
            
            if existing_budget:
                return JsonResponse({
                    'success': False, 
                    'errors': {
                        'category': ['A budget for this category already exists in the selected period.']
                    }
                })
            
            budget.save()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'errors': form.errors})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def delete_budget(request):
    if request.method == 'POST':
        budget_id = request.POST.get('budget_id')
        try:
            budget = Budget.objects.get(id=budget_id, user=request.user)
            budget.delete()
            return JsonResponse({'success': True})
        except Budget.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Budget not found'})
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def categories_chart(request):
    # Placeholder data - will be replaced with actual data later
    context = {
        'chart_data': {
            'labels': ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping'],
            'data': [30, 20, 15, 25, 10],
            'colors': ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
        }
    }
    return render(request, 'finances/categories_chart.html', context)

@login_required
def future_projections(request):
    # Placeholder data - will be replaced with actual data later
    context = {
        'projections': {
            'labels': ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            'income': [2000, 2200, 2100, 2300, 2400, 2500],
            'expenses': [1800, 1900, 2000, 2100, 2200, 2300],
            'savings': [200, 300, 100, 200, 200, 200]
        }
    }
    return render(request, 'finances/future_projections.html', context)

@login_required
def time_analysis(request):
    # Placeholder data - will be replaced with actual data later
    context = {
        'time_data': {
            'labels': ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            'spending': [500, 600, 450, 700],
            'income': [1000, 1000, 1000, 1000]
        }
    }
    return render(request, 'finances/time_analysis.html', context)

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
    
    # Get all categories for the user, ordered by the order field
    categories = Category.objects.filter(user=request.user).order_by('order', 'name')
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
                'type': category.type,  # Include type in the response
                'order': category.order,  # Include order in the response
                'subcategories': subcategories
            }
            
            # Classify based on the type field
            if category.type == 'income':
                income_categories.append(category_data)
            else:
                expense_categories.append(category_data)
                
            logger.info(f"Categorized {category.name} as {category.type}")
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
    
    # Debug output to see what's being received
    print(f"Adding category with POST data: {request.POST}")
    print(f"Type field value: {request.POST.get('type', 'not provided')}")
    
    form = CategoryForm(request.POST)
    if form.is_valid():
        category = form.save(commit=False)
        category.user = request.user
        
        # Explicitly set the type based on the POST data
        if 'type' in request.POST:
            category_type = request.POST['type']
            if category_type == 'income':
                category.type = 'income'
                print("Setting category type to income")
            elif category_type == 'expense':
                category.type = 'expense'
                print("Setting category type to expense")
            else:
                print(f"Unrecognized type value: {category_type}, defaulting to expense")
                category.type = 'expense'
        else:
            print("No type provided, defaulting to expense")
            category.type = 'expense'
            
        category.save()
        
        print(f"Category saved with type: {category.type}")
        
        return JsonResponse({
            'success': True,
            'category': {
                'id': category.id,
                'name': category.name,
                'icon': category.icon,
                'type': category.type,  # Include type in response
                'subcategories': []
            }
        })
    else:
        print(f"Form validation errors: {form.errors}")
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

@login_required
def api_reorder_categories(request):
    """API endpoint to update the order of categories"""
    if request.method != 'POST':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        # Parse JSON data
        data = json.loads(request.body)
        category_type = data.get('category_type')
        category_ids = data.get('category_ids', [])
        
        # Validate data
        if not category_type or not category_ids:
            return JsonResponse({'error': 'Missing required data'}, status=400)
        
        if category_type not in ['income', 'expense']:
            return JsonResponse({'error': 'Invalid category type'}, status=400)
        
        # Check if all category ids belong to the user
        categories = Category.objects.filter(
            user=request.user, 
            id__in=category_ids,
            type=category_type
        )
        
        # Check if we found all the categories
        if categories.count() != len(category_ids):
            return JsonResponse({'error': 'One or more categories not found'}, status=404)
        
        # Update the order for each category
        for index, category_id in enumerate(category_ids):
            category = categories.get(id=category_id)
            category.order = index
            category.save()
        
        return JsonResponse({'success': True})
    
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@login_required
def transactions(request):
    """View for the transactions page with filtering and monthly view"""
    
    # Get current month and year, defaulting to current date
    current_date = timezone.now().date()
    current_month = int(request.GET.get('month', current_date.month))
    current_year = int(request.GET.get('year', current_date.year))
    
    # Get start and end date for the selected month
    start_date = timezone.datetime(current_year, current_month, 1).date()
    if current_month == 12:
        end_date = timezone.datetime(current_year + 1, 1, 1).date() - timedelta(days=1)
    else:
        end_date = timezone.datetime(current_year, current_month + 1, 1).date() - timedelta(days=1)
    
    # Get all transactions for the month
    transactions = Transaction.objects.filter(
        user=request.user,
        date__gte=start_date,
        date__lte=end_date
    ).order_by('-date')
    
    # Calculate total
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
    
    total_balance = income - expenses
    
    # Get all categories for filter and forms
    categories = Category.objects.filter(user=request.user).order_by('order', 'name')
    
    # Get all accounts
    accounts = Account.objects.filter(user=request.user)
    
    # Format month name
    month_names = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December']
    current_month_name = month_names[current_month - 1]
    
    context = {
        'transactions': transactions,
        'categories': categories,
        'accounts': accounts,  # Add accounts to context
        'current_month': current_month,
        'current_year': current_year,
        'current_month_name': current_month_name,
        'total_balance': total_balance,
    }
    
    return render(request, 'finances/transactions.html', context)

@login_required
def transactions_api(request):
    """API endpoint for fetching transactions with filters"""
    
    # Get parameters from request
    current_month = int(request.GET.get('month', timezone.now().date().month))
    current_year = int(request.GET.get('year', timezone.now().date().year))
    category_id = request.GET.get('category', '')
    search_term = request.GET.get('search', '')
    types_param = request.GET.get('types', 'expense,income')
    types = types_param.split(',') if types_param else ['expense', 'income']
    
    # Get start and end date for the selected month
    start_date = timezone.datetime(current_year, current_month, 1).date()
    if current_month == 12:
        end_date = timezone.datetime(current_year + 1, 1, 1).date() - timedelta(days=1)
    else:
        end_date = timezone.datetime(current_year, current_month + 1, 1).date() - timedelta(days=1)
    
    # Filter transactions
    transactions = Transaction.objects.filter(
        user=request.user,
        date__gte=start_date,
        date__lte=end_date,
        type__in=types
    )
    
    # Additional filters
    if category_id:
        transactions = transactions.filter(category_id=category_id)
    
    if search_term:
        transactions = transactions.filter(
            models.Q(title__icontains=search_term) | 
            models.Q(notes__icontains=search_term)
        )
    
    # Order by date (newest first)
    transactions = transactions.order_by('-date')
    
    # Calculate totals
    income = sum(t.amount for t in transactions if t.type == 'income')
    expenses = sum(t.amount for t in transactions if t.type == 'expense')
    total = income - expenses
    
    # Prepare data for JSON response
    transactions_data = []
    for transaction in transactions:
        category_name = transaction.category.name if transaction.category else None
        category_icon = transaction.category.icon if transaction.category else 'bi bi-tag'
        
        transactions_data.append({
            'id': transaction.id,
            'title': transaction.title,
            'amount': float(transaction.amount),
            'date': transaction.date.isoformat(),
            'type': transaction.type,
            'category': transaction.category_id if transaction.category else None,
            'subcategory': transaction.subcategory_id if transaction.subcategory else None,
            'category_name': category_name,
            'category_icon': category_icon,
            'notes': transaction.notes or '',
        })
    
    return JsonResponse({
        'transactions': transactions_data,
        'count': len(transactions_data),
        'total': float(total),
    })

@login_required
def transaction_detail_api(request, transaction_id):
    """API endpoint for getting a single transaction's details"""
    transaction = get_object_or_404(Transaction, id=transaction_id, user=request.user)
    
    data = {
        'id': transaction.id,
        'title': transaction.title,
        'amount': float(transaction.amount),
        'date': transaction.date.isoformat(),
        'type': transaction.type,
        'category': transaction.category_id if transaction.category else None,
        'subcategory': transaction.subcategory_id if transaction.subcategory else None,
        'notes': transaction.notes or '',
    }
    
    return JsonResponse(data)

@login_required
def create_transaction_api(request):
    """API endpoint for creating a transaction"""
    if request.method == 'POST':
        try:
            # Debug: Print out all POST data
            print("Creating transaction with POST data:", request.POST)
            
            title = request.POST.get('title')
            amount = request.POST.get('amount')
            date_str = request.POST.get('date')
            transaction_type = request.POST.get('type')
            category_id = request.POST.get('category') or None
            subcategory_id = request.POST.get('subcategory') or None
            notes = request.POST.get('notes', '')
            
            # Debug: Print all parameters
            print(f"Title: {title}, Amount: {amount}, Date: {date_str}, Type: {transaction_type}")
            print(f"Category ID: {category_id}, Subcategory ID: {subcategory_id}, Notes: {notes}")
            
            # Validate required fields
            if not title or not amount or not date_str or not transaction_type:
                return JsonResponse({'success': False, 'error': 'Missing required fields'})
            
            # Convert amount to float
            try:
                amount = float(amount)
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid amount format'})
            
            # Create the transaction
            transaction = Transaction(
                title=title,
                amount=amount,
                date=date_str,
                type=transaction_type,
                user=request.user,
                notes=notes
            )
            
            if category_id and category_id != 'null' and category_id != '':
                try:
                    category = get_object_or_404(Category, id=category_id, user=request.user)
                    transaction.category = category
                except Exception as e:
                    print(f"Error getting category: {e}")
            
            if subcategory_id and subcategory_id != 'null' and subcategory_id != '':
                try:
                    subcategory = get_object_or_404(SubCategory, id=subcategory_id, parent_category__user=request.user)
                    transaction.subcategory = subcategory
                except Exception as e:
                    print(f"Error getting subcategory: {e}")
            
            transaction.save()
            print(f"Transaction created successfully with ID: {transaction.id}")
            
            return JsonResponse({'success': True, 'transaction_id': transaction.id})
        except Exception as e:
            print(f"Error creating transaction: {e}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def update_transaction_api(request, transaction_id):
    """API endpoint for updating a transaction"""
    transaction = get_object_or_404(Transaction, id=transaction_id, user=request.user)
    
    if request.method == 'POST':
        try:
            # Debug: Print out all POST data
            print(f"Updating transaction {transaction_id} with POST data:", request.POST)
            
            title = request.POST.get('title')
            amount = request.POST.get('amount')
            date_str = request.POST.get('date')
            transaction_type = request.POST.get('type')
            category_id = request.POST.get('category') or None
            subcategory_id = request.POST.get('subcategory') or None
            notes = request.POST.get('notes', '')
            
            # Debug: Print all parameters
            print(f"Title: {title}, Amount: {amount}, Date: {date_str}, Type: {transaction_type}")
            print(f"Category ID: {category_id}, Subcategory ID: {subcategory_id}, Notes: {notes}")
            
            # Validate required fields
            if not title or not amount or not date_str or not transaction_type:
                return JsonResponse({'success': False, 'error': 'Missing required fields'})
            
            # Convert amount to float
            try:
                amount = float(amount)
            except ValueError:
                return JsonResponse({'success': False, 'error': 'Invalid amount format'})
            
            # Update the transaction
            transaction.title = title
            transaction.amount = amount
            transaction.date = date_str
            transaction.type = transaction_type
            transaction.notes = notes
            
            if category_id and category_id != 'null' and category_id != '':
                try:
                    category = get_object_or_404(Category, id=category_id, user=request.user)
                    transaction.category = category
                except Exception as e:
                    print(f"Error getting category: {e}")
            else:
                transaction.category = None
            
            if subcategory_id and subcategory_id != 'null' and subcategory_id != '':
                try:
                    subcategory = get_object_or_404(SubCategory, id=subcategory_id, parent_category__user=request.user)
                    transaction.subcategory = subcategory
                except Exception as e:
                    print(f"Error getting subcategory: {e}")
            else:
                transaction.subcategory = None
            
            transaction.save()
            print(f"Transaction updated successfully: {transaction.id}")
            
            return JsonResponse({'success': True})
        except Exception as e:
            print(f"Error updating transaction: {e}")
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def delete_transaction_api(request, transaction_id):
    """API endpoint for deleting a transaction"""
    transaction = get_object_or_404(Transaction, id=transaction_id, user=request.user)
    
    if request.method == 'POST':
        try:
            transaction.delete()
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@login_required
def api_accounts(request):
    transaction_type = request.GET.get('transaction_type', 'expense')
    accounts = Account.objects.filter(user=request.user)
    
    # For income transactions, exclude credit accounts
    if transaction_type == 'income':
        accounts = accounts.exclude(creditaccount__isnull=False)
    
    account_data = []
    for account in accounts:
        # Get the specific account type instance
        try:
            if hasattr(account, 'debitaccount'):
                account_instance = account.debitaccount
                balance = account_instance.balance
                account_type = 'debit'
            elif hasattr(account, 'creditaccount'):
                account_instance = account.creditaccount
                balance = account_instance.credit_limit - account_instance.current_usage
                account_type = 'credit'
            elif hasattr(account, 'wallet'):
                account_instance = account.wallet
                balance = account_instance.balance
                account_type = 'wallet'
            else:
                continue  # Skip if not a valid account type
                
            account_data.append({
                'id': account.id,
                'name': account.name,
                'type': account_type,
                'balance': float(balance)
            })
        except Exception as e:
            continue  # Skip if there's any error getting the account details
    
    return JsonResponse(account_data, safe=False)

@login_required
def api_account_balance(request, account_id):
    try:
        account = Account.objects.get(id=account_id, user=request.user)
        
        # Get the specific account type instance
        if hasattr(account, 'debitaccount'):
            account_instance = account.debitaccount
            balance = account_instance.balance
        elif hasattr(account, 'creditaccount'):
            account_instance = account.creditaccount
            balance = account_instance.credit_limit - account_instance.current_usage
        elif hasattr(account, 'wallet'):
            account_instance = account.wallet
            balance = account_instance.balance
        else:
            return JsonResponse({'error': 'Invalid account type'}, status=400)
            
        return JsonResponse({'balance': float(balance)})
    except Account.DoesNotExist:
        return JsonResponse({'error': 'Account not found'}, status=404)

@login_required
def charts_view(request):
    # Get the current date and calculate date ranges
    today = timezone.now().date()
    start_of_month = today.replace(day=1)
    start_of_year = today.replace(month=1, day=1)
    
    # Categories Analysis Data
    categories = Category.objects.filter(user=request.user)
    category_data = []
    
    for category in categories:
        total = Transaction.objects.filter(
            user=request.user,
            category=category,
            date__gte=start_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        if total != 0:  # Only include categories with transactions
            category_data.append({
                'category': category.name,
                'amount': float(total)
            })
    
    # Time Analysis Data (Last 6 months)
    time_data = {
        'labels': [],
        'income': [],
        'expenses': []
    }
    
    for i in range(6):
        month = today.replace(day=1) - timedelta(days=30*i)
        month_name = month.strftime('%b %Y')
        time_data['labels'].insert(0, month_name)
        
        # Get income for the month
        income = Transaction.objects.filter(
            user=request.user,
            type='income',
            date__year=month.year,
            date__month=month.month
        ).aggregate(total=Sum('amount'))['total'] or 0
        time_data['income'].insert(0, float(income))
        
        # Get expenses for the month
        expenses = Transaction.objects.filter(
            user=request.user,
            type='expense',
            date__year=month.year,
            date__month=month.month
        ).aggregate(total=Sum('amount'))['total'] or 0
        time_data['expenses'].insert(0, float(expenses))
    
    # Future Projections Data (Next 6 months)
    future_data = {
        'labels': [],
        'projected': []
    }
    
    # Calculate average monthly income and expenses from the last 3 months
    last_3_months_avg = Transaction.objects.filter(
        user=request.user,
        date__gte=today - timedelta(days=90)
    ).aggregate(avg=Avg('amount'))['avg'] or 0
    
    # Project next 6 months
    for i in range(1, 7):
        month = today.replace(day=1) + timedelta(days=30*i)
        month_name = month.strftime('%b %Y')
        future_data['labels'].append(month_name)
        future_data['projected'].append(float(last_3_months_avg))
    
    context = {
        'category_data': json.dumps(category_data),
        'time_data': json.dumps(time_data),
        'future_data': json.dumps(future_data)
    }
    
    return render(request, 'finances/charts.html', context)
