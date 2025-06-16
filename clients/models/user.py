
from django.db import models

class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=128)  # Make sure to hash passwords in production
    company_name = models.CharField(max_length=255)

    def __str__(self):
        return self.username