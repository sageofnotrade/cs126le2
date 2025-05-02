from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal
from .models import ScheduledTransaction, Transaction

def generate_scheduled_transactions(user, start_date, end_date):
    """
    Generate all scheduled transactions for a user within a given date range.
    Returns a list of dictionaries containing transaction details.
    
    Args:
        user: The user to generate transactions for
        start_date: The start date of the range (timezone-aware datetime)
        end_date: The end date of the range (timezone-aware datetime)
    
    Returns:
        List of dictionaries with transaction details
    """
    scheduled_transactions = ScheduledTransaction.objects.filter(user=user)
    generated_transactions = []

    for scheduled in scheduled_transactions:
        # Use local variables to avoid mutating the DB
        current_date = scheduled.date_scheduled
        if not timezone.is_aware(current_date):
            current_date = timezone.make_aware(current_date)
        repeat_type = scheduled.repeat_type
        repeats = scheduled.repeats
        is_recurring = scheduled.is_recurring
        occurrence_number = 1
        max_occurrences = repeats if repeats > 0 else 100  # Safety cap for infinite repeats

        # Generate occurrences within the date range
        while current_date <= end_date and occurrence_number <= max_occurrences:
            if current_date >= start_date:
                generated_transactions.append({
                    'date': current_date,
                    'name': scheduled.name,
                    'type': scheduled.transaction_type,
                    'amount': scheduled.amount,
                    'is_scheduled': True,
                    'scheduled_id': scheduled.id,
                    'category': scheduled.category,
                    'account': scheduled.account
                })
            # Calculate next occurrence
            if repeat_type == 'once':
                break
            elif repeat_type == 'daily':
                current_date += timedelta(days=1)
            elif repeat_type == 'weekly':
                current_date += timedelta(weeks=1)
            elif repeat_type == 'monthly':
                year = current_date.year + (current_date.month // 12)
                month = (current_date.month % 12) + 1
                day = min(current_date.day, (datetime(year, month % 12 + 1, 1) - timedelta(days=1)).day)
                current_date = current_date.replace(year=year, month=month, day=day)
            elif repeat_type == 'yearly':
                year = current_date.year + 1
                day = min(current_date.day, (datetime(year, current_date.month % 12 + 1, 1) - timedelta(days=1)).day)
                current_date = current_date.replace(year=year, day=day)
            else:
                break
            occurrence_number += 1

    return generated_transactions

def get_transactions_with_scheduled(user, start_date, end_date):
    """
    Get all transactions (both actual and scheduled) for a user within a given date range.
    
    Args:
        user: The user to get transactions for
        start_date: The start date of the range (timezone-aware datetime)
        end_date: The end date of the range (timezone-aware datetime)
    
    Returns:
        List of dictionaries with all transaction details, sorted by date
    """
    # Get actual transactions
    actual_transactions = Transaction.objects.filter(
        user=user,
        date__gte=start_date.date(),
        date__lte=end_date.date()
    )
    
    # Convert actual transactions to the same format as scheduled
    transactions = []
    for transaction in actual_transactions:
        transaction_date = timezone.make_aware(datetime.combine(transaction.date, datetime.min.time()))
        transactions.append({
            'date': transaction_date,
            'name': transaction.title,
            'type': transaction.type,
            'amount': transaction.amount,
            'is_scheduled': False,
            'category': transaction.category,
            'account': transaction.transaction_account
        })
    
    # Generate scheduled transactions
    scheduled_transactions = generate_scheduled_transactions(user, start_date, end_date)
    
    # Combine and sort all transactions
    all_transactions = transactions + scheduled_transactions
    all_transactions.sort(key=lambda x: x['date'])
    
    return all_transactions 