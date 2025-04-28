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
    path('export/', views.export_csv, name='export_csv'),
    path('budget/', views.manage_budget, name='manage_budget'),
] 