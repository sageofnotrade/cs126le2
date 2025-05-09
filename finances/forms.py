from django import forms
from .models import Transaction, Category, Budget, Account, DebitAccount, CreditAccount, Wallet, Debt, SubCategory, ScheduledTransaction
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

class ScheduledTransactionForm(forms.ModelForm):
    class Meta:
        model = ScheduledTransaction
        fields = ['name', 'category', 'subcategory', 'transaction_type', 'account', 'amount', 'date_scheduled', 'repeat_type', 'repeats', 'note']
        widgets = {
            'date_scheduled': forms.DateTimeInput(attrs={'type': 'datetime-local', 'min': timezone.now().strftime('%Y-%m-%dT%H:%M')}),
            'note': forms.Textarea(attrs={'rows': 3, 'class': 'form-control'}),
            'amount': forms.NumberInput(attrs={'step': '0.01', 'class': 'form-control'}),
            'repeat_type': forms.Select(attrs={'class': 'form-select'}),
            'repeats': forms.NumberInput(attrs={'class': 'form-control', 'min': '0'}),
        }

    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        if self.user:
            # Filter categories by user
            self.fields['category'].queryset = Category.objects.filter(user=self.user)
            
            # Set up the accounts field based on transaction type
            if 'transaction_type' in self.data:
                transaction_type = self.data.get('transaction_type')
                if transaction_type == 'income':
                    self.fields['account'].queryset = Account.objects.filter(
                        user=self.user
                    ).exclude(
                        creditaccount__isnull=False
                    )
                else:
                    self.fields['account'].queryset = Account.objects.filter(user=self.user)
            else:
                self.fields['account'].queryset = Account.objects.filter(user=self.user)

            # Initialize repeats field based on repeat_type
            if 'repeat_type' in self.data:
                if self.data.get('repeat_type') == 'once':
                    self.fields['repeats'].initial = 1
                    self.fields['repeats'].widget.attrs['readonly'] = True
            elif self.instance and self.instance.repeat_type == 'once':
                self.fields['repeats'].initial = 1
                self.fields['repeats'].widget.attrs['readonly'] = True

    def clean_date_scheduled(self):
        date_scheduled = self.cleaned_data.get('date_scheduled')
        if date_scheduled < timezone.now():
            raise forms.ValidationError("The scheduled date cannot be in the past.")
        return date_scheduled

    def clean_repeats(self):
        repeats = self.cleaned_data.get('repeats')
        repeat_type = self.cleaned_data.get('repeat_type')

        if repeat_type == 'once':
            return 1

        if repeats is None or repeats < 1:
            raise forms.ValidationError("Please enter a valid number of transactions (1 or greater).")
        
        return repeats

    def clean(self):
        cleaned_data = super().clean()
        # Force repeats to 1 for one-time transactions
        if cleaned_data.get('repeat_type') == 'once':
            cleaned_data['repeats'] = 1
        
        account = cleaned_data.get('account')
        amount = cleaned_data.get('amount')
        transaction_type = cleaned_data.get('transaction_type')
        repeat_type = cleaned_data.get('repeat_type')
        repeats = cleaned_data.get('repeats')

        if account and amount and transaction_type == 'expense':  # Only validate balance for expenses
            if hasattr(account, 'creditaccount'):
                available_balance = account.creditaccount.credit_limit - account.creditaccount.current_usage
                if amount > available_balance:
                    raise forms.ValidationError(f"The scheduled amount exceeds the available balance in your credit account. Available balance: {available_balance} USD.")
            elif hasattr(account, 'debitaccount'):
                available_balance = account.debitaccount.balance - (account.debitaccount.maintaining_balance or 0)
                if amount > available_balance:
                    raise forms.ValidationError(f"The scheduled amount exceeds the available balance in your debit account. Available balance: {available_balance} USD.")
            elif hasattr(account, 'wallet'):
                if amount > account.wallet.balance:
                    raise forms.ValidationError(f"The scheduled amount exceeds the available balance in your wallet. Available balance: {account.wallet.balance} USD.")
        return cleaned_data

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
    start_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        initial=timezone.now
    )

    class Meta:
        model = Budget
        fields = ['subcategory', 'account', 'amount', 'duration', 'start_date']

    def __init__(self, *args, user=None, **kwargs):
        super(BudgetForm, self).__init__(*args, **kwargs)
        if user:
            # Filter subcategories based on the parent category's user
            self.fields['subcategory'].queryset = SubCategory.objects.filter(parent_category__user=user)
            # Filter accounts for the current user
            self.fields['account'].queryset = Account.objects.filter(user=user)

class DateRangeForm(forms.Form):
    start_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        initial=timezone.now().replace(day=1)
    )
    end_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'}),
        initial=timezone.now()
    )

class ExportForm(forms.Form):
    separator = forms.CharField(
        max_length=1,
        initial=';',
        widget=forms.TextInput(attrs={'class': 'form-control'})
    )
    start_date = forms.DateField(
        label='From',
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    end_date = forms.DateField(
        label='To',
        widget=forms.DateInput(attrs={'class': 'form-control', 'type': 'date'})
    )
    account = forms.ChoiceField(
        label='Account',
        choices=[('all', 'All accounts')],
        initial='all',
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    include_income = forms.BooleanField(
        label='Income',
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    include_expenses = forms.BooleanField(
        label='Expenses',
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'form-check-input'})
    )
    format = forms.ChoiceField(
        choices=[
            ('csv', 'CSV'),
            ('xlsx', 'Excel')
        ],
        initial='csv',
        widget=forms.Select(attrs={'class': 'form-control'})
    )

    def __init__(self, *args, **kwargs):
        user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
        if user:
            # Get all accounts for the user
            from .models import Account
            account_choices = [('all', 'All accounts')]
            accounts = Account.objects.filter(user=user)
            account_choices.extend([(str(acc.id), acc.name) for acc in accounts])
            self.fields['account'].choices = account_choices

class ImportForm(forms.Form):
    file = forms.FileField(
        widget=forms.FileInput(attrs={
            'class': 'form-control',
            'accept': '.csv,.xlsx'
        }),
        required=True,
        help_text='Select a file previously exported from this system'
    )
    duplicate_handling = forms.ChoiceField(
        choices=[
            ('skip', 'Skip duplicates'),
            ('update', 'Update existing'),
            ('create_new', 'Create new')
        ],
        widget=forms.Select(attrs={'class': 'form-select'}),
        initial='skip'
    )

    def clean_file(self):
        file = self.cleaned_data['file']
        ext = file.name.split('.')[-1].lower()
        if ext not in ['csv', 'xlsx']:
            raise forms.ValidationError('Only CSV and Excel files exported from this system are supported.')
        return file 