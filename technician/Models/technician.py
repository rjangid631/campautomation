from django.db import models
from django.contrib.auth.models import Group, Permission
from users.models import BaseUser
from camp_manager.Models.Patientdata import PatientData
from clients.models.camp import Camp
from clients.models.service import Service

class Technician(BaseUser):
    camps = models.ManyToManyField(Camp, related_name='technicians')
    services = models.ManyToManyField(Service, related_name='technicians')

    groups = models.ManyToManyField(
        Group,
        related_name='technician_groups',
        blank=True,
        help_text='The groups this technician belongs to.',
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        Permission,
        related_name='technician_permissions',
        blank=True,
        help_text='Specific permissions for this technician.',
        verbose_name='user permissions',
    )

    def __str__(self):
        return f"{self.name} - Technician"
