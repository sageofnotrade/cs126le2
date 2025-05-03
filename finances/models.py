from datetime import timedelta, datetime
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.conf import settings
from django.urls import reverse
import uuid
from decimal import Decimal
import json

class Debt(models.Model):
    DEBT_TYPES = (
        ('debt', 'Debt'),
        ('credit', 'Credit'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    person = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    date_issued = models.DateField(default=timezone.now)
    date_payback = models.DateField()
    notes = models.TextField(blank=True)
    debt_type = models.CharField(max_length=10, choices=DEBT_TYPES)  # 'debt' or 'credit'
    
    def __str__(self):
        if self.debt_type.lower() == 'debt':
            return f"You → {self.person}: {self.amount}"
        return f"{self.person} → You: {self.amount}"

    @property
    def residual_amount(self):
        return self.amount - self.paid

class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"{self.__class__.__name__}: {self.name}"

    def get_account_type(self):
        if hasattr(self, 'creditaccount'):
            return 'credit'
        elif hasattr(self, 'debitaccount'):
            return 'debit'
        elif hasattr(self, 'wallet'):
            return 'wallet'
        return 'unknown'

class DebitAccount(Account):
    balance = models.DecimalField(max_digits=10, decimal_places=2)
    maintaining_balance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

class CreditAccount(Account):
    current_usage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2)
    payment_due_date = models.DateField(null=True, blank=True)
    minimum_payment = models.DecimalField(max_digits=10, decimal_places=2, default=0)

class Wallet(Account):
    balance = models.DecimalField(max_digits=10, decimal_places=2)

class Category(models.Model):
    CATEGORY_TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )
    
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    icon = models.CharField(max_length=50, default='bi-tag')
    type = models.CharField(max_length=7, choices=CATEGORY_TYPES, default='expense')
    order = models.IntegerField(default=0)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['order', 'name']

class SubCategory(models.Model):
    name = models.CharField(max_length=100)
    parent_category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='subcategories')
    icon = models.CharField(max_length=50, default='bi-tag-fill')
    
    def __str__(self):
        return f"{self.parent_category.name} - {self.name}"
    
    class Meta:
        verbose_name_plural = "SubCategories"

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )
    
    CURRENCY_CHOICES = (
        ('PHP', 'Philippine Peso (₱)'),
        ('USD', 'US Dollar ($)'),
        ('EUR', 'Euro (€)'),
        ('GBP', 'British Pound (£)'),
        ('JPY', 'Japanese Yen (¥)'),
        ('CNY', 'Chinese Yuan (¥)'),
        ('KRW', 'Korean Won (₩)'),
    )
    
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default='PHP')
    date = models.DateField(default=timezone.now)
    time = models.TimeField(default=timezone.now)
    type = models.CharField(max_length=7, choices=TRANSACTION_TYPES)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True)
    transaction_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notes = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='transaction_photos/', null=True, blank=True)
    
    def __str__(self):
        return f"{self.title} - {self.amount}"
    
    class Meta:
        ordering = ['-date', '-time']

class ScheduledTransaction(models.Model):
    TRANSACTION_TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )

    REPEAT_TYPES = (
        ('once', 'One-time'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    )

    STATUS_CHOICES = (
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.SET_NULL, null=True, blank=True)
    transaction_type = models.CharField(max_length=7, choices=TRANSACTION_TYPES)
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date_scheduled = models.DateTimeField()
    repeat_type = models.CharField(max_length=7, choices=REPEAT_TYPES)
    repeats = models.PositiveIntegerField(default=1)
    note = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='scheduled')
    last_occurrence = models.DateTimeField(null=True, blank=True)
    next_occurrence = models.DateTimeField(null=True, blank=True)
    is_recurring = models.BooleanField(default=False)
    parent_transaction = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='child_transactions')
    occurrence_number = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.name} - {self.amount} ({self.transaction_type})"

    def clean(self):
        super().clean()
        if self.date_scheduled < timezone.now():
            raise ValidationError("Scheduled date cannot be in the past.")
        
        if self.repeat_type == 'once' and self.repeats != 1:
            raise ValidationError("One-time transactions must have exactly 1 repeat.")
        
        # Calculate next occurrence
        self.calculate_next_occurrence()

    def calculate_next_occurrence(self):
        print(f"\n=== Calculating next occurrence for transaction: {self.name} ===")
        print(f"Current state - Last occurrence: {self.last_occurrence}, Repeat type: {self.repeat_type}, Repeats: {self.repeats}")
        
        if self.status == 'completed':
            print("Transaction is completed, no next occurrence")
            self.next_occurrence = None
            return

        # If no last_occurrence, use date_scheduled as the last occurrence
        if not self.last_occurrence:
            print("No last occurrence, using scheduled date as last occurrence")
            self.last_occurrence = self.date_scheduled

        if self.repeats == 0 or self.is_recurring:  # Infinite repeats
            print("Infinite repeats or recurring transaction")
            if self.repeat_type == 'daily':
                print("Daily repeat - adding 1 day")
                self.next_occurrence = self.last_occurrence + timedelta(days=1)
            elif self.repeat_type == 'weekly':
                print("Weekly repeat - adding 1 week")
                self.next_occurrence = self.last_occurrence + timedelta(weeks=1)
            elif self.repeat_type == 'monthly':
                print("\nMonthly repeat calculation:")
                print(f"Current date: {self.last_occurrence}")
                print(f"Current day: {self.last_occurrence.day}")
                
                next_month = self.last_occurrence.month + 1
                next_year = self.last_occurrence.year
                if next_month > 12:
                    next_month = 1
                    next_year += 1
                print(f"Next month/year: {next_month}/{next_year}")
                
                # Get the last day of the next month
                if next_month == 12:
                    last_day_next_month = (datetime(next_year + 1, 1, 1) - timedelta(days=1)).day
                else:
                    last_day_next_month = (datetime(next_year, next_month + 1, 1) - timedelta(days=1)).day
                print(f"Last day of next month: {last_day_next_month}")
                
                # Use the same day of month, but not exceeding the last day of the next month
                day = min(self.last_occurrence.day, last_day_next_month)
                print(f"Selected day: {day}")
                
                self.next_occurrence = self.last_occurrence.replace(month=next_month, year=next_year, day=day)
                print(f"Calculated next occurrence: {self.next_occurrence}")
            elif self.repeat_type == 'yearly':
                print("\nYearly repeat calculation:")
                print(f"Current date: {self.last_occurrence}")
                print(f"Current day: {self.last_occurrence.day}")
                
                next_year = self.last_occurrence.year + 1
                print(f"Next year: {next_year}")
                
                # Get the last day of the month in the next year
                if self.last_occurrence.month == 12:
                    last_day_next_month = (datetime(next_year + 1, 1, 1) - timedelta(days=1)).day
                else:
                    last_day_next_month = (datetime(next_year, self.last_occurrence.month + 1, 1) - timedelta(days=1)).day
                print(f"Last day of month in next year: {last_day_next_month}")
                
                # Use the same day of month, but not exceeding the last day of the month
                day = min(self.last_occurrence.day, last_day_next_month)
                print(f"Selected day: {day}")
                
                self.next_occurrence = self.last_occurrence.replace(year=next_year, day=day)
                print(f"Calculated next occurrence: {self.next_occurrence}")
        else:
            print(f"Finite repeats - occurrence number: {self.occurrence_number}, total repeats: {self.repeats}")
            # For finite repeats, check if we've reached the limit
            if self.occurrence_number >= self.repeats:
                print("Reached repeat limit, no next occurrence")
                self.next_occurrence = None
            else:
                print("Still have repeats remaining")
                # Calculate next occurrence based on repeat type
                if self.repeat_type == 'daily':
                    self.next_occurrence = self.last_occurrence + timedelta(days=1)
                elif self.repeat_type == 'weekly':
                    self.next_occurrence = self.last_occurrence + timedelta(weeks=1)
                elif self.repeat_type == 'monthly':
                    next_month = self.last_occurrence.month + 1
                    next_year = self.last_occurrence.year
                    if next_month > 12:
                        next_month = 1
                        next_year += 1
                    last_day_next_month = (datetime(next_year, next_month + 1, 1) - timedelta(days=1)).day
                    day = min(self.last_occurrence.day, last_day_next_month)
                    self.next_occurrence = self.last_occurrence.replace(month=next_month, year=next_year, day=day)
                elif self.repeat_type == 'yearly':
                    next_year = self.last_occurrence.year + 1
                    last_day_next_month = (datetime(next_year, self.last_occurrence.month + 1, 1) - timedelta(days=1)).day
                    day = min(self.last_occurrence.day, last_day_next_month)
                    self.next_occurrence = self.last_occurrence.replace(year=next_year, day=day)
        
        print(f"Final next occurrence: {self.next_occurrence}\n")

    def mark_as_processed(self):
        """Mark this transaction as processed and update last_occurrence"""
        if self.next_occurrence:
            self.last_occurrence = self.next_occurrence
            self.occurrence_number += 1
            self.calculate_next_occurrence()
            self.save()

    def generate_next_occurrence(self):
        """Generate the next occurrence of this transaction"""
        if not self.next_occurrence or self.status == 'completed':
            return None

        next_transaction = ScheduledTransaction(
            user=self.user,
            name=self.name,
            category=self.category,
            subcategory=self.subcategory,
            transaction_type=self.transaction_type,
            account=self.account,
            amount=self.amount,
            date_scheduled=self.next_occurrence,
            repeat_type=self.repeat_type,
            repeats=self.repeats,
            note=self.note,
            status='scheduled',
            is_recurring=self.repeats == 0,  # True if infinite repeats
            parent_transaction=self.parent_transaction or self,
            occurrence_number=self.occurrence_number + 1
        )
        
        next_transaction.save()
        return next_transaction

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['date_scheduled']

class Budget(models.Model):
    DURATION_CHOICES = [
        ('1 week', '1 Week'),
        ('1 month', '1 Month')
    ]

    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE, db_index=True, null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, db_index=True, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_index=True)
    duration = models.CharField(max_length=20, choices=DURATION_CHOICES)
    start_date = models.DateField(default=timezone.now, db_index=True)
    end_date = models.DateField(db_index=True)

    def __str__(self):
        if self.subcategory:
            return f"{self.subcategory.name} - {self.amount} ({self.duration})"
        elif self.category:
            return f"{self.category.name} - {self.amount} ({self.duration})"
        return f"Budget - {self.amount} ({self.duration})"

    def get_spent_amount(self):
        """Calculate the amount spent in this budget's subcategory for the current period"""
        from django.db.models import Sum
        
        # If this budget is for a subcategory
        if self.subcategory:
            spent = Transaction.objects.filter(
                user=self.user,
                type='expense',
                subcategory=self.subcategory,
                date__gte=self.start_date,
                date__lte=self.end_date,
                transaction_account=self.account
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            return spent
        
        # If this budget is for a main category (without subcategory)
        elif self.category:
            spent = Transaction.objects.filter(
                user=self.user,
                type='expense',
                category=self.category,
                date__gte=self.start_date,
                date__lte=self.end_date,
                transaction_account=self.account
            ).aggregate(Sum('amount'))['amount__sum'] or 0
            return spent
            
        return 0
        
    def get_remaining_amount(self):
        """Calculate the remaining budget"""
        return self.amount - self.get_spent_amount()
        
    def get_percentage_spent(self):
        """Calculate the percentage of budget used"""
        if self.amount > 0:
            return round((self.get_spent_amount() / self.amount) * 100)
        return 0

    @classmethod
    def get_default_start_date(cls):
        """Get the default start date for a new budget (start of current period)"""
        today = timezone.now().date()
        # For weekly budgets, start from the beginning of the current week (Monday)
        return today - timedelta(days=today.weekday())

    def calculate_end_date(self):
        """Calculate the end date based on start date and duration"""
        if self.duration == '1 week':
            return self.start_date + timedelta(days=6)  # End on Sunday
        elif self.duration == '1 month':
            # Start from the first day of the next month
            next_month = self.start_date.replace(day=1)
            if self.start_date.month == 12:
                next_month = next_month.replace(year=next_month.year + 1, month=1)
            else:
                next_month = next_month.replace(month=next_month.month + 1)
            # Return the last day of the current month
            return next_month - timedelta(days=1)
        return None

    @classmethod
    def get_current_period_dates(cls, duration='1 month'):
        """Get the start and end dates for the current budget period"""
        today = timezone.now().date()
        if duration == '1 week':
            # Get Monday of current week
            start_date = today - timedelta(days=today.weekday())
            # Get Sunday of current week
            end_date = start_date + timedelta(days=6)
        else:  # month
            # Get first day of current month
            start_date = today.replace(day=1)
            # Get last day of current month
            if today.month == 12:
                next_month = today.replace(year=today.year + 1, month=1, day=1)
            else:
                next_month = today.replace(month=today.month + 1, day=1)
            end_date = next_month - timedelta(days=1)
        return start_date, end_date

    def save(self, *args, **kwargs):
        # Set default start date for new budgets
        if not self.pk and not self.start_date:
            self.start_date = self.get_default_start_date()
        
        # Calculate end date if not set
        if not self.end_date:
            self.end_date = self.calculate_end_date()
        
        # Validate the model
        self.clean()
        
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('category', 'subcategory', 'user', 'start_date', 'account')
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['user', 'subcategory']),
            models.Index(fields=['user', 'category']),
        ]  

class DashboardPreference(models.Model):
    """Store user preferences for the customizable dashboard."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dashboard_preference')
    columns = models.IntegerField(default=2)
    visible_elements = models.TextField(default='["accounts", "budgets", "chart-balance", "chart-last-7-days"]')
    hidden_elements = models.TextField(default='["credit-cards", "debts-credits", "transactions", "scheduled-transactions", "balance-currency", "cash-flow"]')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_visible_elements(self):
        """Return the visible elements as a list."""
        return json.loads(self.visible_elements)
    
    def set_visible_elements(self, elements_list):
        """Set the visible elements from a list."""
        self.visible_elements = json.dumps(elements_list)
    
    def get_hidden_elements(self):
        """Return the hidden elements as a list."""
        return json.loads(self.hidden_elements)
    
    def set_hidden_elements(self, elements_list):
        """Set the hidden elements from a list."""
        self.hidden_elements = json.dumps(elements_list)

    def __str__(self):
        return f"{self.user.username}'s Dashboard Preferences"  