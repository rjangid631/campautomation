from django.apps import AppConfig

class TechnicianConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'technician'

    def ready(self):
        import technician.signals  # ✅ Register the signal here
