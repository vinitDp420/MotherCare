import os
import sys
sys.path.append(os.getcwd())

import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.urls import get_resolver
from django.urls.resolvers import URLPattern, URLResolver

def list_urls(lis, prefix=''):
    for entry in lis:
        if isinstance(entry, URLPattern):
            print(prefix + str(entry.pattern), entry.name)
        elif isinstance(entry, URLResolver):
            list_urls(entry.url_patterns, prefix + str(entry.pattern))

resolver = get_resolver()
list_urls(resolver.url_patterns)
