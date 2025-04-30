from datetime import timedelta
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

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

class DebitAccount(Account):
    balance = models.DecimalField(max_digits=10, decimal_places=2)
    maintaining_balance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

class CreditAccount(Account):
    current_usage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2)

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

class Budget(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    spent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)  # The account from which the budget comes
    duration = models.CharField(max_length=20, choices=[('1 week', '1 Week'), ('1 month', '1 Month')])  # Duration (1 week or 1 month)

    start_date = models.DateField(default=timezone.now)  # Default to current date
    end_date = models.DateField()  # Calculated based on duration

    def __str__(self):
        return f"{self.category.name} - {self.amount} ({self.duration})"

    @property
    def remaining(self):
        return self.amount - self.spent

    @property
    def percentage_used(self):
        if self.amount > 0:
            return round((self.spent / self.amount) * 100, 2)
        return 0

    def save(self, *args, **kwargs):
        # Calculate the end_date based on the start_date and duration
        if not self.end_date:  # Only calculate if end_date is not set (to avoid overriding)
            if self.duration == '1 week':
                self.end_date = self.start_date + timedelta(weeks=1)
            elif self.duration == '1 month':
                self.end_date = self.start_date.replace(month=self.start_date.month + 1)
        super().save(*args, **kwargs)

    class Meta:
        unique_together = ('category', 'user', 'start_date', 'account')  