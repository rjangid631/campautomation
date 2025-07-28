# camp_manager/Models/Pathology.py

from django.db import models
from camp_manager.Models.Patientdata import PatientData

class Pathology(models.Model):
    patient = models.OneToOneField(PatientData, on_delete=models.CASCADE, related_name='pathology')

    height = models.FloatField(null=True, blank=True)
    weight = models.FloatField(null=True, blank=True)
    bp = models.CharField(max_length=20, null=True, blank=True)
    pulse = models.IntegerField(null=True, blank=True)
    body_temperature = models.FloatField(null=True, blank=True)
    body_fat = models.FloatField(null=True, blank=True)
    visceral_rate = models.FloatField(null=True, blank=True)
    bmr = models.FloatField(null=True, blank=True)
    muscle_mass = models.FloatField(null=True, blank=True)
    muscle_rate = models.FloatField(null=True, blank=True)
    skeletal_muscle = models.FloatField(null=True, blank=True)
    bone_mass = models.FloatField(null=True, blank=True)
    protein_rate = models.FloatField(null=True, blank=True)
    protein_mass = models.FloatField(null=True, blank=True)
    oxygen_saturation = models.FloatField(null=True, blank=True)
    heart_rate = models.IntegerField(null=True, blank=True)
    
    lipid = models.FloatField(null=True, blank=True)
    rbc = models.FloatField(null=True, blank=True)
    hb = models.FloatField(null=True, blank=True)
    random_blood_sugar = models.FloatField(null=True, blank=True)
    creatinine = models.FloatField(null=True, blank=True)
    egfr = models.FloatField(null=True, blank=True)
    total_bilirubin = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pathology data for {self.patient}"
