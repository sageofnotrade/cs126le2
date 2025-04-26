from django.contrib import admin
from .models import Category, Transaction, Budget

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

admin.site.register(Category, CategoryAdmin)
admin.site.register(Transaction, TransactionAdmin)
admin.site.register(Budget, BudgetAdmin)
