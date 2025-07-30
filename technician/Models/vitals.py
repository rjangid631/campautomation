from django.db import models
from camp_manager.Models.Patientdata import PatientData

class Vitals(models.Model):
    patient = models.OneToOneField(PatientData, on_delete=models.CASCADE, related_name='patient_vitals')

    height = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    bp = models.CharField(max_length=20, null=True, blank=True)
    pulse = models.IntegerField(null=True, blank=True)
    oxygen_saturation = models.FloatField(null=True, blank=True)
    body_temperature = models.FloatField(null=True, blank=True)
    inhale = models.FloatField(null=True, blank=True)
    exhale = models.FloatField(null=True, blank=True)
    abdomen = models.CharField(max_length=100, null=True, blank=True)

    # New Fields
    heart_rate = models.IntegerField(null=True, blank=True)
    body_fat = models.FloatField(null=True, blank=True)
    visceral_rate = models.FloatField(null=True, blank=True)
    bmr = models.FloatField(null=True, blank=True)  # Basal Metabolic Rate
    muscle_mass = models.FloatField(null=True, blank=True)
    muscle_rate = models.FloatField(null=True, blank=True)
    skeletal_muscle = models.FloatField(null=True, blank=True)
    bone_mass = models.FloatField(null=True, blank=True)
    protein_rate = models.FloatField(null=True, blank=True)
    protein_mass = models.FloatField(null=True, blank=True)

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
