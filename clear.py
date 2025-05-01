# Run this if you need to reset the whole database because you messed up the whole schema or smthng

import os
import django

# Setup Django environment (Replace 'mysite.settings' with your actual settings module path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'budget_tracker.settings')
django.setup()

from django.apps import apps

# Loop through all models except auth.User
for model in apps.get_models():
    if model.__name__ != "User":
        model.objects.all().delete()
