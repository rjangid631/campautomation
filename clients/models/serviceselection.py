from django.db import models

class ServiceSelection(models.Model):
    company_id = models.CharField(max_length=20, unique=True)
    selected_services = models.JSONField()

    def __str__(self):
        return f"Company ID: {self.company_id}, Services: {self.selected_services}"
    