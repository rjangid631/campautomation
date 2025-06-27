from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
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

class Client(AbstractBaseUser, PermissionsMixin):
    client_id = models.CharField(max_length=20, unique=True, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(unique=True)
    contact_number = models.CharField(max_length=15, unique=True)

    gst_number = models.CharField(max_length=15, unique=True, null=True, blank=True)
    pan_card = models.CharField(max_length=10, unique=True, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    district = models.CharField(max_length=255, null=True, blank=True)
    state = models.CharField(max_length=255, null=True, blank=True)
    pin_code = models.CharField(max_length=10, null=True, blank=True)
    landmark = models.CharField(max_length=255, null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = ClientManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['name', 'contact_number']  # Keep only what you collect

    def __str__(self):
        return f"{self.email} - {self.name}"
    
    def save(self, *args, **kwargs):
        if not self.client_id:
            self.client_id = generate_client_id()
        super().save(*args, **kwargs)