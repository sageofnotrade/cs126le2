from django.contrib import admin
from .models import Category, Transaction, Budget, Account, CreditAccount, DebitAccount, Wallet

class TransactionAdmin(admin.ModelAdmin):
    list_display = ('title', 'amount', 'type', 'category', 'date', 'user')
    list_filter = ('type', 'category', 'date', 'user')
    search_fields = ('title', 'notes')
    date_hierarchy = 'date'

class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user')
    list_filter = ('user',)
    search_fields = ('name',)

class BudgetAdmin(admin.ModelAdmin):
    list_display = ('category', 'amount', 'month', 'user')
    list_filter = ('category', 'month', 'user')

class AccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'description', 'user')
    list_filter = ('user',)
    search_fields = ('name', 'description')

class CreditAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'current_usage', 'credit_limit', 'user')
    list_filter = ('user',)

class DebitAccountAdmin(admin.ModelAdmin):
    list_display = ('name', 'balance', 'maintaining_balance', 'user')
    list_filter = ('user',)

class WalletAdmin(admin.ModelAdmin):
    list_display = ('name', 'balance', 'user')
    list_filter = ('user',)

admin.site.register(Category, CategoryAdmin)
admin.site.register(Transaction, TransactionAdmin)
admin.site.register(Budget, BudgetAdmin)
admin.site.register(Account, AccountAdmin)
admin.site.register(CreditAccount, CreditAccountAdmin)
admin.site.register(DebitAccount, DebitAccountAdmin)
admin.site.register(Wallet, WalletAdmin)