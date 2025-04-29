from django.test import TestCase
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Category, SubCategory

# Create your tests here.

class DefaultCategoriesTest(TestCase):
    def test_default_categories_creation(self):
        """Test that default categories are created when a user registers"""
        # Register a new user
        response = self.client.post(reverse('signup'), {
            'username': 'testuser',
            'email': 'test@example.com',
            'password1': 'complexpassword123',
            'password2': 'complexpassword123',
        })
        
        # Check that the user was created
        self.assertEqual(User.objects.count(), 1)
        user = User.objects.first()
        
        # Check that the default categories were created
        all_categories = Category.objects.filter(user=user)
        
        # Check the total count (4 income + 11 expense = 15 total)
        self.assertEqual(all_categories.count(), 15)
        
        # Check income categories
        income_categories = Category.objects.filter(user=user, type='income')
        self.assertEqual(income_categories.count(), 4)
        self.assertTrue(income_categories.filter(name='Salary').exists())
        self.assertTrue(income_categories.filter(name='Freelance or Sideline Income').exists())
        self.assertTrue(income_categories.filter(name='Investment Income').exists())
        self.assertTrue(income_categories.filter(name='Other Income').exists())
        
        # Check expense categories
        expense_categories = Category.objects.filter(user=user, type='expense')
        self.assertEqual(expense_categories.count(), 11)
        self.assertTrue(expense_categories.filter(name='Transportation').exists())
        self.assertTrue(expense_categories.filter(name='Food/Drinks').exists())
        self.assertTrue(expense_categories.filter(name='Other Expenses').exists())
        
        # Check that subcategories were created for "Other Income"
        other_income = Category.objects.get(user=user, name='Other Income')
        subcategories = SubCategory.objects.filter(parent_category=other_income)
        self.assertEqual(subcategories.count(), 2)
        self.assertTrue(subcategories.filter(name='Money Gifts').exists())
        self.assertTrue(subcategories.filter(name='Loan Repayments').exists())
