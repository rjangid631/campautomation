# technician/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from technician.Models.technician import Technician
from technician.Models.optometrists import Optometrist
from technician.Models.doctors import Doctor


@receiver(post_save, sender=Technician)
def create_profiles_for_technician(sender, instance, created, **kwargs):
    if not created:
        return

    user = instance.user
    if not user:
        return

    # 1) Safely get a display name
    full_name = getattr(user, 'name', None) or f"{user.first_name} {user.last_name}".strip()
    if not full_name:
        full_name = user.username

    # 2) Create Optometrist profile if it doesn’t exist
    if not hasattr(instance, 'optometrist_profile'):
        Optometrist.objects.create(
            technician=instance,
            user=user,
            name=full_name
        )

    # 3) Create Doctor profile if the user’s login_type is 'Doctor'
    if getattr(user, 'login_type', '') == 'Doctor' and not hasattr(instance, 'doctor_profile'):
        Doctor.objects.create(
            technician=instance,
            user=user,
            name=full_name
        )