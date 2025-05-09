from django.urls import path
from . import views
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('add/', views.add_transaction, name='add_transaction'),
    path('edit/<int:pk>/', views.edit_transaction, name='edit_transaction'),
    path('delete/<int:pk>/', views.delete_transaction, name='delete_transaction'),
    path('accounts/', views.accounts_list, name='accounts_list'),
    path('accounts/delete/<int:account_id>/', views.delete_account, name='delete_account'),
    path('debts/', views.debts_list, name='debts_list'),
    path('debts/add/', views.add_debt, name='add_debt'),
    path('debts/edit/<int:pk>/', views.edit_debt, name='edit_debt'),
    path('debts/delete/<int:pk>/', views.delete_debt, name='delete_debt'),
    path('debts/update_payment/<int:pk>/', views.update_payment, name='update_payment'),
    path('scheduled/', views.scheduled_transactions, name='scheduled_transactions'),
    path('scheduled/create/', views.create_scheduled_transaction, name='create_scheduled_transaction'),
    path('scheduled/edit/<int:pk>/', views.edit_scheduled_transaction, name='edit_scheduled_transaction'),
    path('scheduled/delete/<int:pk>/', views.delete_scheduled_transaction, name='delete_scheduled_transaction'),
    path('scheduled/resolve/<int:pk>/', views.resolve_scheduled_transaction, name='resolve_scheduled_transaction'),
    path('categories/', views.categories, name='categories'),
    path('api/categories/', views.api_categories, name='api_categories'),
    path('api/categories/add/', views.api_add_category, name='api_add_category'),
    path('api/categories/<int:category_id>/delete/', views.api_delete_category, name='api_delete_category'),
    path('api/categories/<int:category_id>/update/', views.api_update_category, name='api_update_category'),
    path('api/categories/<int:category_id>/subcategories/', views.api_subcategories, name='api_subcategories'),
    path('api/categories/<int:category_id>/subcategories/add/', views.api_add_subcategory, name='api_add_subcategory'),
    path('api/subcategories/<int:subcategory_id>/', views.api_subcategory_detail, name='api_subcategory_detail'),
    path('api/subcategories/<int:subcategory_id>/delete/', views.api_delete_subcategory, name='api_delete_subcategory'),
    path('api/subcategories/<int:subcategory_id>/update/', views.api_update_subcategory, name='api_update_subcategory'),
    path('api/categories/reorder/', views.api_reorder_categories, name='api_reorder_categories'),
    path('import-export/', views.import_export_data, name='import_export_data'),
    path('budget/', views.manage_budget, name='manage_budget'),
    path('budgets/add/', views.add_budget, name='add_budget'),
    path('budgets/edit/', views.update_budget, name='update_budget'),
    path('budgets/delete/', views.delete_budget, name='delete_budget'),
    path('api/get_budgets/', views.get_budgets, name='get_budgets'),
    # Charts URLs
    path('charts/', views.charts_view, name='charts'),
    path('charts/categories/', views.categories_chart, name='categories_chart'),
    path('charts/future/', views.future_projections, name='future_projections'),
    path('charts/time/', views.time_analysis, name='time_analysis'),
    path('charts/data/time/', views.charts_data_time, name='charts_data_time'),
    path('charts/data/future/', views.charts_data_future, name='charts_data_future'),
    # New transaction routes
    path('transactions/', views.transactions, name='transactions'),
    path('transactions/api/', views.transactions_api, name='transactions_api'),
    path('transactions/api/<int:transaction_id>/', views.transaction_detail_api, name='transaction_detail_api'),
    path('transactions/api/create/', views.create_transaction_api, name='create_transaction_api'),
    path('transactions/api/<int:transaction_id>/update/', views.update_transaction_api, name='update_transaction_api'),
    path('transactions/api/<int:transaction_id>/delete/', views.delete_transaction_api, name='delete_transaction_api'),
    path('transactions/api/batch-delete/', views.batch_delete_transactions_api, name='batch_delete_transactions_api'),
    path('api/accounts/', views.api_accounts, name='api_accounts'),
    path('api/accounts/<int:account_id>/balance/', views.api_account_balance, name='api_account_balance'),
    # Dashboard
    path('', views.dashboard, name='dashboard'),
    path('save-dashboard-preferences/', views.save_dashboard_preferences, name='save_dashboard_preferences'),
    
    # Authentication
    path('signup/', views.signup, name='signup'),
    path('test-scheduled/', views.test_scheduled_transactions, name='test_scheduled_transactions'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) 