from django.db import models
from clients.models.client import Client  # Updated import

class ServiceDetails(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True, related_name='service_details')
    service_name = models.CharField(max_length=255)
    total_cases = models.IntegerField()

    def __str__(self):
        return f"{self.service_name} for {self.client.name}"