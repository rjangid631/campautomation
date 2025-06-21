from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin

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
    client_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(unique=True)
    contact_number = models.CharField(max_length=15, unique=True)
    gst_number = models.CharField(max_length=15, unique=True)
    pan_card = models.CharField(max_length=10, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    district = models.CharField(max_length=255, null=True, blank=True)
    state = models.CharField(max_length=255, null=True, blank=True)
    pin_code = models.CharField(max_length=10, null=True, blank=True)
    landmark = models.CharField(max_length=255, null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = ClientManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['client_id', 'name', 'contact_number', 'gst_number', 'pan_card']

    def __str__(self):
        return f"{self.client_id} - {self.name}"
