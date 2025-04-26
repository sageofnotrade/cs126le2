from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import login, logout
from datetime import timedelta
import calendar
import csv
import json
from .models import Transaction, Category, Budget
from .forms import TransactionForm, CategoryForm, BudgetForm, DateRangeForm
from django import forms
from django.contrib.auth.models import User

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
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            category = form.save(commit=False)
            category.user = request.user
            category.save()
            messages.success(request, 'Category added successfully.')
            return redirect('categories')
    else:
        form = CategoryForm()
    
    categories = Category.objects.filter(user=request.user)
    
    return render(request, 'finances/categories.html', {'form': form, 'categories': categories})

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