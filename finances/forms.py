from django import forms
from .models import Transaction, Category, Budget, Account, DebitAccount, CreditAccount, Wallet, Debt, SubCategory
from django.utils import timezone
import datetime

class TransactionForm(forms.ModelForm):
    class Meta:
        model = Transaction
        fields = ['title', 'amount', 'currency', 'date', 'time', 'type', 'category', 'subcategory', 'transaction_account', 'notes', 'photo']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date', 'class': 'form-control'}),
            'time': forms.TimeInput(attrs={'type': 'time', 'class': 'form-control'}),
            'notes': forms.Textarea(attrs={'rows': 3, 'class': 'form-control', 'placeholder': 'Optional notes'}),
            'currency': forms.Select(attrs={'class': 'form-select'}),
            'photo': forms.FileInput(attrs={'class': 'form-control', 'accept': 'image/*'}),
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
            
            # Set up the accounts field
            self.fields['transaction_account'].queryset = Account.objects.filter(user=self.user)
            
            # Add some helpful labels and placeholders
            self.fields['title'].label = "Title"
            self.fields['amount'].label = "Amount"
            self.fields['amount'].widget.attrs.update({'placeholder': '0.00', 'step': '0.01'})
            self.fields['category'].label = "Category"
            self.fields['subcategory'].label = "Subcategory"
            self.fields['transaction_account'].label = "Account"

class DebtForm(forms.ModelForm):
    class Meta:
        model = Debt
        fields = ['person', 'amount', 'date_issued', 'date_payback', 'notes', 'debt_type']
        widgets = {
            'date_issued': forms.DateInput(attrs={'type': 'date'}),
            'date_payback': forms.DateInput(attrs={'type': 'date'}),
        }

    def __init__(self, *args, **kwargs):
        super(DebtForm, self).__init__(*args, **kwargs)
        self.fields['debt_type'].choices = [
            ('debt', 'Debt'),
            ('credit', 'Credit')
        ]

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
        fields = ['name', 'icon', 'type']
        widgets = {
            'icon': forms.HiddenInput(),  # This will be set by JavaScript
            'type': forms.HiddenInput()  # This will be set by JavaScript too
        }
    
    def clean_type(self):
        """
        Ensure the type field is properly formatted
        """
        type_value = self.cleaned_data.get('type')
        print(f"Cleaning type value: {type_value}")
        
        # If type is 'expenses', convert to 'expense'
        if type_value == 'expenses':
            type_value = 'expense'
            print(f"Converted 'expenses' to 'expense'")
        
        # Ensure it's one of the valid choices
        valid_types = dict(Category.CATEGORY_TYPES).keys()
        if type_value not in valid_types:
            print(f"Invalid type '{type_value}', defaulting to 'expense'")
            return 'expense'  # Default to expense if invalid
            
        print(f"Final type value: {type_value}")
        return type_value

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
    duration = forms.ChoiceField(choices=[('1 week', '1 Week'), ('1 month', '1 Month')])
    account = forms.ModelChoiceField(queryset=Account.objects.all(), required=True)

    class Meta:
        model = Budget
        fields = ['category', 'account', 'amount', 'duration']

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