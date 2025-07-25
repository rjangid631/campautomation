# technician/Models/optometrists.py

from django.conf import settings
from django.db import models

from technician.Models.technician import Technician

class Optometrist(models.Model):
    technician = models.OneToOneField(Technician, on_delete=models.CASCADE, related_name="optometrist_profile")
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, default="Optometrist")
    signature = models.ImageField(upload_to='optometrist_signatures/', blank=True, null=True)

    def __str__(self):
        return self.name
