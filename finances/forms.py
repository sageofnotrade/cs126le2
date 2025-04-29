from django import forms
from .models import Transaction, Category, Budget, Account, DebitAccount, CreditAccount, Wallet, SubCategory
from django.utils import timezone
import datetime

class TransactionForm(forms.ModelForm):
    class Meta:
        model = Transaction
        fields = ['title', 'amount', 'date', 'type', 'category', 'subcategory', 'notes']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'notes': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
        }
    
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        # Customize the queryset for the category field
        if self.user:
            self.fields['category'].queryset = Category.objects.filter(user=self.user)
            
            # Disable subcategory field initially - it will be populated via JavaScript
            self.fields['subcategory'].queryset = SubCategory.objects.none()
            
            # If we're editing and have a category selected, populate subcategories
            if 'instance' in kwargs and kwargs['instance'] and kwargs['instance'].category:
                category = kwargs['instance'].category
                self.fields['subcategory'].queryset = SubCategory.objects.filter(parent_category=category)

class AccountForm(forms.ModelForm):
    class Meta:
        model = Account
        fields = ['name', 'description']

class DebitAccountForm(AccountForm):
    balance = forms.DecimalField(max_digits=10, decimal_places=2)
    maintaining_balance = forms.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta(AccountForm.Meta):
        model = DebitAccount
        fields = AccountForm.Meta.fields + ['balance', 'maintaining_balance']

class CreditAccountForm(AccountForm):
    current_usage = forms.DecimalField(max_digits=10, decimal_places=2, initial=0)
    credit_limit = forms.DecimalField(max_digits=10, decimal_places=2)

    class Meta(AccountForm.Meta):
        model = CreditAccount
        fields = AccountForm.Meta.fields + ['current_usage', 'credit_limit']

class WalletForm(AccountForm):
    balance = forms.DecimalField(max_digits=10, decimal_places=2)

    class Meta(AccountForm.Meta):
        model = Wallet
        fields = AccountForm.Meta.fields + ['balance']

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'icon']
        widgets = {
            'icon': forms.HiddenInput()  # This will be set by JavaScript
        }

class SubCategoryForm(forms.ModelForm):
    class Meta:
        model = SubCategory
        fields = ['name', 'icon', 'parent_category']
        widgets = {
            'parent_category': forms.HiddenInput(),
        }
        
    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        category_id = kwargs.pop('category_id', None)
        super().__init__(*args, **kwargs)
        
        if user and category_id:
            # Set the initial value for parent_category
            self.fields['parent_category'].initial = category_id
            
            # Validate that the category belongs to the user
            if not Category.objects.filter(id=category_id, user=user).exists():
                raise forms.ValidationError("Invalid category selection")

class BudgetForm(forms.ModelForm):
    month = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'month'}),
        initial=timezone.now().replace(day=1)
    )
    
    class Meta:
        model = Budget
        fields = ['category', 'amount', 'month']
    
    def __init__(self, *args, user=None, **kwargs):
        super(BudgetForm, self).__init__(*args, **kwargs)
        if user:
            self.fields['category'].queryset = Category.objects.filter(user=user)

class DateRangeForm(forms.Form):
    start_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        initial=timezone.now().replace(day=1)
    )
    end_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        initial=timezone.now()
    ) 