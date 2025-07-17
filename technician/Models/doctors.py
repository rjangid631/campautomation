from django.conf import settings
from django.db import models

from technician.Models.technician import Technician



class Doctor(models.Model):
    technician = models.OneToOneField(Technician,on_delete=models.CASCADE,related_name="doctor_profile")
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    designation = models.CharField(max_length=100, blank=True, null=True)
    signature = models.ImageField(upload_to='doctor_signatures/', blank=True, null=True)
    
    def __str__(self):
        return self.name