# Generated by Django 5.2 on 2025-05-03 00:59

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('finances', '0023_alter_scheduledtransaction_date_scheduled_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='scheduledtransaction',
            name='subcategory',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='finances.subcategory'),
        ),
    ]
