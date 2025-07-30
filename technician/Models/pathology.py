# camp_manager/Models/Pathology.py

from django.db import models
from camp_manager.Models.Patientdata import PatientData

class Pathology(models.Model):
    patient = models.OneToOneField(PatientData, on_delete=models.CASCADE, related_name='pathology')

    rbc = models.FloatField(null=True, blank=True)
    hb = models.FloatField(null=True, blank=True)
    random_blood_sugar = models.FloatField(null=True, blank=True)
    creatinine = models.FloatField(null=True, blank=True)
    egfr = models.FloatField(null=True, blank=True)
    total_bilirubin = models.FloatField(null=True, blank=True)
    total_cholesterol = models.FloatField(null=True, blank=True)  # 👈 New field added
    report = models.FileField(upload_to='pathology_reports/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pathology data for {self.patient}"
