# technician/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver

from technician.Models.technician import Technician
from technician.Models.optometrists import Optometrist
from technician.Models.doctors import Doctor


@receiver(post_save, sender=Technician)
def create_profiles_for_technician(sender, instance, created, **kwargs):
    if created:
        # 🔹 Create Optometrist profile if not already
        if not hasattr(instance, 'optometrist_profile'):
            Optometrist.objects.create(
                technician=instance,
                user=instance,
                name=instance.name
            )

        # 🔹 If technician is also a doctor
        if instance.login_type == 'Doctor' and not hasattr(instance, 'doctor_profile'):
            Doctor.objects.create(
                technician=instance,
                user=instance,
                name=instance.name
            )
