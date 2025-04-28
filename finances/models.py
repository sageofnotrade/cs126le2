from datetime import timedelta
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Account(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name

class DebitAccount(Account):
    balance = models.DecimalField(max_digits=10, decimal_places=2)
    maintaining_balance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

class CreditAccount(Account):
    current_usage = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    credit_limit = models.DecimalField(max_digits=10, decimal_places=2)

class Wallet(Account):
    balance = models.DecimalField(max_digits=10, decimal_places=2)

class Category(models.Model):
    name = models.CharField(max_length=100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    icon = models.ImageField(upload_to='category_icons/', blank=True, null=True)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name_plural = "Categories"

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('income', 'Income'),
        ('expense', 'Expense'),
    )
    
    title = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=timezone.now)
    type = models.CharField(max_length=7, choices=TRANSACTION_TYPES)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    notes = models.TextField(blank=True, null=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True)  # Added account field
    
    def __str__(self):
        return f"{self.title} - {self.amount}"
    
    class Meta:
        ordering = ['-date']

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