from django.db import models

from camp_manager.Models.Patientdata import PatientData
 # Assuming Users is in store.models

class Optometry(models.Model):
    patient = models.OneToOneField(PatientData, on_delete=models.CASCADE, related_name='patient_optometry')

    # Vision fields
    far_vision_right = models.CharField(max_length=100, null=True, blank=True)
    far_vision_left = models.CharField(max_length=100, null=True, blank=True)
    near_vision_right = models.CharField(max_length=100, null=True, blank=True)
    near_vision_left = models.CharField(max_length=100, null=True, blank=True)

    # Colour vision
    color_vision_normal = models.BooleanField(default=False)
    color_vision_other = models.CharField(max_length=255, null=True, blank=True)

    pdf_report = models.FileField(upload_to='optometry_reports/', null=True, blank=True)

    @property
    def patient_name(self):
        return self.patient.patient_name

    @property
    def patient_id(self):
        return self.patient.patient_id

    @property
    def age(self):
        return self.patient.age

    @property
    def gender(self):
        return self.patient.gender

    def __str__(self):
        return f"{self.patient.patient_name} - Optometry"
