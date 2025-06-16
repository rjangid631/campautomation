from django.db import models
from .client import Client

class Company(models.Model):
    name = models.CharField(max_length=255, unique=True)
    district = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    pin_code = models.CharField(max_length=10)
    landmark = models.CharField(max_length=255)

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='companies', null=True, blank=True)



    def __str__(self):
        return self.name