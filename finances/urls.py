from django.urls import path
from . import views

urlpatterns = [
    path('add/', views.add_transaction, name='add_transaction'),
    path('edit/<int:pk>/', views.edit_transaction, name='edit_transaction'),
    path('delete/<int:pk>/', views.delete_transaction, name='delete_transaction'),
    path('accounts/', views.accounts_list, name='accounts_list'),
    path('accounts/delete/<int:account_id>/', views.delete_account, name='delete_account'),
    path('summary/', views.monthly_summary, name='monthly_summary'),
    path('categories/', views.categories, name='categories'),
    path('api/categories/', views.api_categories, name='api_categories'),
    path('api/categories/add/', views.api_add_category, name='api_add_category'),
    path('api/categories/<int:category_id>/delete/', views.api_delete_category, name='api_delete_category'),
    path('api/categories/<int:category_id>/subcategories/', views.api_subcategories, name='api_subcategories'),
    path('api/categories/<int:category_id>/subcategories/add/', views.api_add_subcategory, name='api_add_subcategory'),
    path('api/subcategories/<int:subcategory_id>/delete/', views.api_delete_subcategory, name='api_delete_subcategory'),
    path('api/subcategories/<int:subcategory_id>/update/', views.api_update_subcategory, name='api_update_subcategory'),
    path('api/categories/reorder/', views.api_reorder_categories, name='api_reorder_categories'),
    path('export/', views.export_csv, name='export_csv'),
    path('budget/', views.manage_budget, name='manage_budget'),
    
    # New transaction routes
    path('transactions/', views.transactions, name='transactions'),
    path('transactions/api/', views.transactions_api, name='transactions_api'),
    path('transactions/api/<int:transaction_id>/', views.transaction_detail_api, name='transaction_detail_api'),
    path('transactions/api/create/', views.create_transaction_api, name='create_transaction_api'),
    path('transactions/api/<int:transaction_id>/update/', views.update_transaction_api, name='update_transaction_api'),
    path('transactions/api/<int:transaction_id>/delete/', views.delete_transaction_api, name='delete_transaction_api'),
] 