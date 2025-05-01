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
        
        # Check the total count (4 income + 10 expense = 14 total)
        self.assertEqual(all_categories.count(), 14)
        
        # Check income categories
        income_categories = Category.objects.filter(user=user, type='income')
        self.assertEqual(income_categories.count(), 4)
        self.assertTrue(income_categories.filter(name='Salary/Wages').exists())
        self.assertTrue(income_categories.filter(name='Business Income').exists())
        self.assertTrue(income_categories.filter(name='Investments').exists())
        self.assertTrue(income_categories.filter(name='Other Income').exists())
        
        # Check expense categories
        expense_categories = Category.objects.filter(user=user, type='expense')
        self.assertEqual(expense_categories.count(), 10)
        self.assertTrue(expense_categories.filter(name='Housing').exists())
        self.assertTrue(expense_categories.filter(name='Utilities').exists())
        self.assertTrue(expense_categories.filter(name='Food').exists())
        self.assertTrue(expense_categories.filter(name='Transportation').exists())
        self.assertTrue(expense_categories.filter(name='Insurance').exists())
        self.assertTrue(expense_categories.filter(name='Entertainment').exists())
        self.assertTrue(expense_categories.filter(name='Healthcare').exists())
        self.assertTrue(expense_categories.filter(name='Debt Payments').exists())
        self.assertTrue(expense_categories.filter(name='Savings/Investments').exists())
        self.assertTrue(expense_categories.filter(name='Miscellaneous').exists())
        
        # Check icons for a few categories
        self.assertEqual(Category.objects.get(user=user, name='Salary/Wages').icon, 'bi-cash-coin')
        self.assertEqual(Category.objects.get(user=user, name='Housing').icon, 'bi-house')
        self.assertEqual(Category.objects.get(user=user, name='Utilities').icon, 'bi-lightning')
        self.assertEqual(Category.objects.get(user=user, name='Food').icon, 'bi-cup-hot')
