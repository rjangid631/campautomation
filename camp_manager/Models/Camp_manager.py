# camp_manager/models.py
from django.db import models
from django.contrib.auth.models import BaseUserManager, Group, Permission
from users.models import BaseUser

class CampManagerUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Camp Manager must have an email")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class CampManager(BaseUser):
    login_type = models.CharField(max_length=20, default='Coordinator')

    groups = models.ManyToManyField(
        Group,
        related_name='campmanager_groups',
        blank=True,
        help_text='The groups this camp manager belongs to.',
        verbose_name='groups'
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='campmanager_permissions',
        blank=True,
        help_text='Specific permissions for this camp manager.',
        verbose_name='user permissions'
    )

    objects = CampManagerUserManager()
