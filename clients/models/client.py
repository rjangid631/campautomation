from django.db import models
from django.contrib.auth.models import BaseUserManager, Group, Permission
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
    name = models.CharField(max_length=255, blank=True)
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
        ('Technician', 'Technician'),
        ('Doctor', 'Doctor'),
        ('Optometrist', 'Optometrist'),
        ('Dentist', 'Dentist'),
    )
    login_type = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Client')

    # Permissions fields to avoid reverse accessor clashes
    groups = models.ManyToManyField(
        Group,
        related_name='client_groups',
        blank=True,
        help_text='The groups this client belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='client_permissions',
        blank=True,
        help_text='Specific permissions for this client.',
        verbose_name='user permissions',
    )

    objects = ClientManager()

    def save(self, *args, **kwargs):
        if not self.client_id:
            self.client_id = generate_client_id()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.login_type})"
