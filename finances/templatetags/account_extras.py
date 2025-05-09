from django import template

register = template.Library()

@register.filter
def get_item(dictionary, key):
    return dictionary.get(key)

@register.filter
def div(value, arg):
    return float(value) / float(arg) if arg else 0

@register.filter
def mul(value, arg):
    return float(value) * float(arg)

@register.filter
def sub(value, arg):
    return float(value) - float(arg)