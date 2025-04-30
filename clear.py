# Run this if you need to reset the whole database because you messed up the whole schema or smthng

import os
import django

# Setup Django environment (Replace 'mysite.settings' with your actual settings module path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'budget_tracker.settings')
django.setup()

from finances.models import Debt, Transaction, Budget, Wallet, CreditAccount, DebitAccount, Account
from django.db import connection

# Temporarily disable foreign key constraints in SQLite
with connection.cursor() as cursor:
    cursor.execute("PRAGMA foreign_keys = OFF;")

    # Delete your objects
    Debt.objects.all().delete()
    Transaction.objects.all().delete()
    Budget.objects.all().delete()
    Wallet.objects.all().delete()
    CreditAccount.objects.all().delete()
    DebitAccount.objects.all().delete()
    Account.objects.all().delete()

    cursor.execute("PRAGMA foreign_keys = ON;")

print("Database cleared successfully.")
