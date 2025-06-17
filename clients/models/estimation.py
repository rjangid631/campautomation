from django.db import models

from clients.models.client import Client

class Estimation(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True, related_name="estimations")
    pdf_file = models.FileField(upload_to='estimations/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.client.name} - {self.created_at}"