# camp_manager/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from camp_manager.Models.Patientdata import PatientData

@receiver(post_save, sender=PatientData)
def assign_package_on_create(sender, instance, created, **kwargs):
    if created and not instance.package:
        excel_upload = instance.excel_upload
        if excel_upload and excel_upload.package:
            instance.package = excel_upload.package
            instance.save(update_fields=['package'])
            print(f"✅ Assigned package '{excel_upload.package}' to patient '{instance.patient_name}'")
