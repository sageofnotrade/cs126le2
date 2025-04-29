from django.contrib import admin
from .models import Category, Transaction, Budget, Account, CreditAccount, DebitAccount, Wallet, SubCategory, Debt

class TransactionAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'date', 'type', 'category', 'subcategory', 'user')
    list_filter = ('type', 'date', 'category', 'user')
    search_fields = ('title', 'notes')
    date_hierarchy = 'date'

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'icon', 'type')
    list_filter = ('user', 'type')
    search_fields = ('name',)

class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'parent_category', 'icon')
    list_filter = ('parent_category',)
    search_fields = ('name',)

class BudgetAdmin(admin.ModelAdmin):
    list_display = ('category', 'amount', 'month', 'user')
    list_filter = ('category', 'user', 'month')

class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'user')
    list_filter = ('user',)
    search_fields = ('name', 'description')

class CreditAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'current_usage', 'credit_limit')
    list_filter = ('user',)
    search_fields = ('name', 'description')

class DebitAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'balance', 'maintaining_balance')
    list_filter = ('user',)
    search_fields = ('name', 'description')

class WalletAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'balance')
    list_filter = ('user',)
    search_fields = ('name', 'description')
    
class DebtAdmin(admin.ModelAdmin):
    list_display = ('person', 'amount', 'paid', 'date_issued', 'date_payback', 'residual_amount', 'account', 'notes', 'user')
    list_filter = ('date_issued', 'date_payback', 'person', 'account', 'user')
    search_fields = ('person', 'notes')

admin.site.register(Transaction, TransactionAdmin)
admin.site.register(Category, CategoryAdmin)
admin.site.register(SubCategory, SubCategoryAdmin)
admin.site.register(Budget, BudgetAdmin)
admin.site.register(Account, AccountAdmin)
admin.site.register(CreditAccount, CreditAccountAdmin)
admin.site.register(DebitAccount, DebitAccountAdmin)
admin.site.register(Wallet, WalletAdmin)
admin.site.register(Debt, DebtAdmin)
