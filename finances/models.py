from datetime import timedelta
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError

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
        ('daily', 'Repeats Daily'),
        ('weekly', 'Repeats Weekly'),
        ('monthly', 'Repeats Monthly'),
        ('yearly', 'Repeats Yearly'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True)
    date_scheduled = models.DateField(default=timezone.now)
    repeat_type = models.CharField(max_length=7, choices=REPEAT_TYPES, default='once')
    repeats = models.PositiveIntegerField(default=0)
    note = models.TextField(blank=True, null=True)
    transaction_type = models.CharField(max_length=7, choices=TRANSACTION_TYPES)
    last_occurrence = models.DateField(null=True, blank=True)  # Track the last occurrence
    occurrences_remaining = models.PositiveIntegerField(null=True, blank=True)  # Track remaining occurrences

    def __str__(self):
        return f"{self.name} - {self.amount} ({self.transaction_type})"

    def save(self, *args, **kwargs):
        if not self.pk:  # New instance
            if self.repeat_type == 'once':
                self.occurrences_remaining = 1
            else:
                self.occurrences_remaining = self.repeats if self.repeats > 0 else None
        super().save(*args, **kwargs)

    def get_next_occurrence(self):
        """Calculate the next occurrence date based on repeat_type"""
        if self.repeat_type == 'once':
            return self.date_scheduled
        elif self.repeat_type == 'daily':
            return self.date_scheduled + timezone.timedelta(days=1)
        elif self.repeat_type == 'weekly':
            return self.date_scheduled + timezone.timedelta(weeks=1)
        elif self.repeat_type == 'monthly':
            return self.date_scheduled + timezone.timedelta(days=30)  # Approximate
        elif self.repeat_type == 'yearly':
            return self.date_scheduled + timezone.timedelta(days=365)  # Approximate
        return None

    def get_occurrences_for_month(self, year, month):
        """Get all occurrences of this transaction for a specific month"""
        occurrences = []
        current_date = self.date_scheduled
        remaining = self.occurrences_remaining if self.occurrences_remaining is not None else float('inf')
        
        while (current_date.year < year or 
               (current_date.year == year and current_date.month <= month)) and remaining > 0:
            if current_date.year == year and current_date.month == month:
                occurrences.append(current_date)
            current_date = self.get_next_occurrence()
            remaining -= 1
            
        return occurrences

    def get_monthly_amount(self, year, month):
        """Calculate the total amount for a specific month"""
        occurrences = self.get_occurrences_for_month(year, month)
        return self.amount * len(occurrences)

class Budget(models.Model):
    DURATION_CHOICES = [
        ('1 week', '1 Week'),
        ('1 month', '1 Month')
    ]

    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE, db_index=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, db_index=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0.01)])
    account = models.ForeignKey(Account, on_delete=models.CASCADE, db_index=True)
    duration = models.CharField(max_length=20, choices=DURATION_CHOICES)
    start_date = models.DateField(default=timezone.now, db_index=True)
    end_date = models.DateField(db_index=True)

    def __str__(self):
        return f"{self.subcategory.name} - {self.amount} ({self.duration})"

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

    @property
    def spent(self):
        """Calculate total spent from transactions within the budget period"""
        return Transaction.objects.filter(
            user=self.user,
            type='expense',
            subcategory=self.subcategory,
            date__gte=self.start_date,
            date__lte=self.end_date,
            transaction_account=self.account
        ).aggregate(total=models.Sum('amount'))['total'] or 0

    @property
    def remaining(self):
        return self.amount - self.spent

    @property
    def percentage_used(self):
        if self.amount > 0:
            return round((self.spent / self.amount) * 100, 2)
        return 0

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
        unique_together = ('subcategory', 'user', 'start_date', 'account')
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['user', 'subcategory']),
        ]  