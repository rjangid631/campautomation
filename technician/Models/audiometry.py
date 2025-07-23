from django.db import models

from camp_manager.Models.Patientdata import PatientData
from technician.Models.audiometrist import Audiometrist

# Dropdown choices for ear findings
FINDING_CHOICES = [
    ('Normal', 'Normal'),
    ('Mild', 'Mild'),
    ('Moderate', 'Moderate'),
    ('Moderate-Severe', 'Moderate-Severe'),
    ('Severe', 'Severe'),
    ('Profound', 'Profound'),
]

class Audiometry(models.Model):
    patient = models.ForeignKey(PatientData, on_delete=models.CASCADE, related_name='audiometries')
    audiometrist = models.ForeignKey(Audiometrist, on_delete=models.SET_NULL, null=True, blank=True)

    # Left Air Conduction (in dB at different frequencies)
    left_air_250 = models.IntegerField(null=True, blank=True)
    left_air_500 = models.IntegerField(null=True, blank=True)
    left_air_1000 = models.IntegerField(null=True, blank=True)
    left_air_2000 = models.IntegerField(null=True, blank=True)
    left_air_4000 = models.IntegerField(null=True, blank=True)
    left_air_8000 = models.IntegerField(null=True, blank=True)

    # Right Air Conduction
    right_air_250 = models.IntegerField(null=True, blank=True)
    right_air_500 = models.IntegerField(null=True, blank=True)
    right_air_1000 = models.IntegerField(null=True, blank=True)
    right_air_2000 = models.IntegerField(null=True, blank=True)
    right_air_4000 = models.IntegerField(null=True, blank=True)
    right_air_8000 = models.IntegerField(null=True, blank=True)

    # Left Bone Conduction
    left_bone_250 = models.IntegerField(null=True, blank=True)
    left_bone_500 = models.IntegerField(null=True, blank=True)
    left_bone_1000 = models.IntegerField(null=True, blank=True)
    left_bone_2000 = models.IntegerField(null=True, blank=True)
    left_bone_4000 = models.IntegerField(null=True, blank=True)

    # Right Bone Conduction
    right_bone_250 = models.IntegerField(null=True, blank=True)
    right_bone_500 = models.IntegerField(null=True, blank=True)
    right_bone_1000 = models.IntegerField(null=True, blank=True)
    right_bone_2000 = models.IntegerField(null=True, blank=True)
    right_bone_4000 = models.IntegerField(null=True, blank=True)

    # Ear Findings with Dropdown Options
    left_ear_finding = models.CharField(max_length=20, choices=FINDING_CHOICES, null=True, blank=True)
    right_ear_finding = models.CharField(max_length=20, choices=FINDING_CHOICES, null=True, blank=True)

    # Shyam code: Added PDF report field
    pdf_report = models.FileField(upload_to='audiometry_reports/', null=True, blank=True)

    @property
    def age(self):
        return self.patient.age

    @property
    def gender(self):
        return self.patient.gender

    def __str__(self):
        return f"{self.patient.patient_name} - Audiometry"
