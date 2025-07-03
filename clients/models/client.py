# clients/models.py
from django.db import models
from django.contrib.auth.models import BaseUserManager
from users.models import BaseUser
import uuid

def generate_client_id():
    return f"CL-{uuid.uuid4().hex[:6].upper()}"

class ClientManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Clients must have an email address")
        email = self.normalize_email(email)
        client = self.model(email=email, **extra_fields)
        client.set_password(password)
        client.save(using=self._db)
        return client

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class Client(BaseUser):
    client_id = models.CharField(max_length=20, unique=True, null=True, blank=True)

    gst_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    pan_card = models.CharField(max_length=10, unique=True, null=True, blank=True)
    district = models.CharField(max_length=255, null=True, blank=True)
    state = models.CharField(max_length=255, null=True, blank=True)
    pin_code = models.CharField(max_length=10, null=True, blank=True)
    landmark = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    ROLE_CHOICES = (
        ('Client', 'Client'),
        ('Coordinator', 'Coordinator'),
    )
    login_type = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Client')

    objects = ClientManager()

    def save(self, *args, **kwargs):
        if not self.client_id:
            self.client_id = generate_client_id()
        super().save(*args, **kwargs)
