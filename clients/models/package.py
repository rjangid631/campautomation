from django.db import models
from django.core.exceptions import ValidationError

from clients.models.client import Client
from .service import Service  # Import from same directory

class Package(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True, related_name='packages')
    name = models.CharField(max_length=100)
    services = models.ManyToManyField('Service')  # Link to service
    start_date = models.DateField()
    end_date = models.DateField()

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError("End date cannot be earlier than start date.")

    def __str__(self):
        return f"{self.name} ({self.start_date} to {self.end_date})"
