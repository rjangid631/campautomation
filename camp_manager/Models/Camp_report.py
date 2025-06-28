from django.db import models
from clients.models.camp import Camp

class CampReport(models.Model):
    camp = models.OneToOneField(Camp, on_delete=models.CASCADE, related_name='report')
    google_drive_link = models.URLField()
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Report for {self.camp}"
