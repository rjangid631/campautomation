from django.db import models
from camp_manager.Models.Patientdata import PatientData

class Vitals(models.Model):
    patient = models.OneToOneField(PatientData, on_delete=models.CASCADE, related_name='patient_vitals')
    height = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    bp = models.CharField(max_length=20, null=True, blank=True)  # Example: "120/80"
    pulse = models.IntegerField(null=True, blank=True)
    oxygen_saturation = models.FloatField(null=True, blank=True)  # Example: 98.6 (%)
    body_temperature = models.FloatField(null=True, blank=True)   # Example: 36.6 °C
    inhale = models.FloatField(null=True, blank=True)             # Could be time in seconds or volume in liters
    exhale = models.FloatField(null=True, blank=True)             # Same unit as inhale
    abdomen = models.CharField(max_length=100, null=True, blank=True)  # Can be modified based on use-case

    pdf_report = models.FileField(upload_to='vitals_reports/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    @property
    def age(self):
        return self.patient.age

    @property
    def gender(self):
        return self.patient.gender

    def __str__(self):
        return f"{self.patient.patient_name} - Vitals"
