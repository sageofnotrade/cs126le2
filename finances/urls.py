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
    path('summary/', views.monthly_summary, name='monthly_summary'),
    path('categories/', views.categories, name='categories'),
    path('export/', views.export_csv, name='export_csv'),
    path('budget/', views.manage_budget, name='manage_budget'),
    path('budget/add/', views.add_budget, name='add_budget'),
    path('budget/update/', views.update_budget, name='update_budget'),
    path('budget/delete/', views.delete_budget, name='delete_budget'),
    path('api/get_budgets/', views.get_budgets, name='get_budgets'),
    # New chart URLs
    path('charts/categories/', views.categories_chart, name='categories_chart'),
    path('charts/future/', views.future_projections, name='future_projections'),
    path('charts/time/', views.time_analysis, name='time_analysis'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT) 