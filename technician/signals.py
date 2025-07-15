from clients.models.client import Client
from technician.Models.doctors import Doctor
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Client)
def create_doctor_profile(sender, instance, created, **kwargs):
    if created and instance.login_type == 'Doctor':
        Doctor.objects.get_or_create(user=instance, defaults={'name': instance.name})
