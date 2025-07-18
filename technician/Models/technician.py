# technician/models/technician.py

from django.conf import settings  # to get AUTH_USER_MODEL
from django.db import models
from clients.models.camp import Camp
from clients.models.service import Service

class Technician(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="technician",
        null=True,
        blank=True  # <-- Add this
    )

    camps = models.ManyToManyField(Camp, related_name='technicians')
    services = models.ManyToManyField(Service, related_name='technicians')

    def __str__(self):
        return self.user.name if self.user else f"Technician #{self.id}"
