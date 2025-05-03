from datetime import datetime, timedelta
from django.utils import timezone
from decimal import Decimal
from .models import ScheduledTransaction, Transaction
from django.db.models import Q

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
    scheduled_transactions = ScheduledTransaction.objects.filter(
        user=user,
        date_scheduled__lte=end_date
    ).order_by('date_scheduled')

    generated_transactions = []
    
    for scheduled in scheduled_transactions:
        # If status is completed or failed, only show the actual occurrence if in range
        if scheduled.status in ('completed', 'failed'):
            if scheduled.date_scheduled >= start_date and scheduled.date_scheduled <= end_date:
                generated_transactions.append({
                    'id': scheduled.id,
                    'title': scheduled.name,
                    'amount': float(scheduled.amount),
                    'date': scheduled.date_scheduled,
                    'type': scheduled.transaction_type,
                    'category': scheduled.category.name if scheduled.category else None,
                    'subcategory': scheduled.subcategory.name if scheduled.subcategory else None,
                    'account': scheduled.account.name if scheduled.account else None,
                    'note': scheduled.note,
                    'status': scheduled.status,
                    'is_scheduled': True,
                    'scheduled_id': scheduled.id,
                    'repeat_type': scheduled.repeat_type,
                    'repeats': scheduled.repeats,
                    'occurrence_number': 1
                })
            continue

        # For recurring transactions, count completed/failed child occurrences
        completed_count = ScheduledTransaction.objects.filter(
            parent_transaction=scheduled,
            status__in=['completed', 'failed']
        ).count()
        # For one-time transactions, just add them if they're within the date range
        if scheduled.repeat_type == 'once':
            if scheduled.date_scheduled >= start_date and scheduled.date_scheduled <= end_date:
                generated_transactions.append({
                    'id': scheduled.id,
                    'title': scheduled.name,
                    'amount': float(scheduled.amount),
                    'date': scheduled.date_scheduled,
                    'type': scheduled.transaction_type,
                    'category': scheduled.category.name if scheduled.category else None,
                    'subcategory': scheduled.subcategory.name if scheduled.subcategory else None,
                    'account': scheduled.account.name if scheduled.account else None,
                    'note': scheduled.note,
                    'status': scheduled.status,
                    'is_scheduled': True,
                    'scheduled_id': scheduled.id,
                    'repeat_type': scheduled.repeat_type,
                    'repeats': scheduled.repeats,
                    'occurrence_number': 1
                })
            continue

        # For recurring transactions, generate up to (repeats - completed_count) occurrences (unless repeats==0)
        current_date = scheduled.date_scheduled
        occurrence_count = 0
        if scheduled.repeats > 0:
            max_occurrences = scheduled.repeats - completed_count
            if max_occurrences < 0:
                max_occurrences = 0
        else:
            max_occurrences = 1000  # safety cap for infinite
        while occurrence_count < max_occurrences:
            if current_date > end_date:
                break
            if current_date >= start_date and current_date <= end_date:
                generated_transactions.append({
                    'id': scheduled.id,
                    'title': scheduled.name,
                    'amount': float(scheduled.amount),
                    'date': current_date,
                    'type': scheduled.transaction_type,
                    'category': scheduled.category.name if scheduled.category else None,
                    'subcategory': scheduled.subcategory.name if scheduled.subcategory else None,
                    'account': scheduled.account.name if scheduled.account else None,
                    'note': scheduled.note,
                    'status': scheduled.status,
                    'is_scheduled': True,
                    'scheduled_id': scheduled.id,
                    'repeat_type': scheduled.repeat_type,
                    'repeats': scheduled.repeats,
                    'occurrence_number': completed_count + occurrence_count + 1
                })
            occurrence_count += 1
            # Calculate next occurrence based on repeat type
            if scheduled.repeat_type == 'daily':
                current_date += timedelta(days=1)
            elif scheduled.repeat_type == 'weekly':
                current_date += timedelta(weeks=1)
            elif scheduled.repeat_type == 'monthly':
                if current_date.month == 12:
                    current_date = current_date.replace(year=current_date.year + 1, month=1)
                else:
                    current_date = current_date.replace(month=current_date.month + 1)
            elif scheduled.repeat_type == 'yearly':
                current_date = current_date.replace(year=current_date.year + 1)

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