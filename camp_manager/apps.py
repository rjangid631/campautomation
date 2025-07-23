# camp_manager/apps.py

from django.apps import AppConfig

class CampManagerConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'camp_manager'

    def ready(self):
        import camp_manager.signal  # 👈 This connects your signal
