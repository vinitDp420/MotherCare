from django.apps import AppConfig


class NewbornConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.newborn'
    label = 'newborn'

    def ready(self):
        import apps.newborn.signals

