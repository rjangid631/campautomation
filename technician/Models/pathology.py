from django.db import models
from camp_manager.Models.Patientdata import PatientData

class Pathology(models.Model):
    patient = models.OneToOneField(PatientData, on_delete=models.CASCADE, related_name='pathology')

    rbc = models.FloatField(null=True, blank=True)
    hb = models.FloatField(null=True, blank=True)
    blood_sugar_level = models.FloatField(null=True, blank=True)
    creatinine = models.FloatField(null=True, blank=True)
    egfr = models.FloatField(null=True, blank=True)
    total_bilirubin = models.FloatField(null=True, blank=True)
    direct_bilirubin = models.FloatField(null=True, blank=True)     # 👈 New field
    indirect_bilirubin = models.FloatField(null=True, blank=True)   # 👈 New field
    total_cholesterol = models.FloatField(null=True, blank=True)
    triglycerides = models.FloatField(null=True, blank=True)        # 👈 New field
    ldl = models.FloatField(null=True, blank=True)                  # 👈 New field
    hdl = models.FloatField(null=True, blank=True)                  # 👈 New field
    vldl = models.FloatField(null=True, blank=True)                 # 👈 New field
    pcv = models.FloatField(null=True, blank=True)                  # 👈 New field
    mcv = models.FloatField(null=True, blank=True)                  # 👈 New field
    mch = models.FloatField(null=True, blank=True)                  # 👈 New field
    mchc = models.FloatField(null=True, blank=True)                 # 👈 New field
    lipids = models.TextField(null=True, blank=True)                # 👈 Optional textual description

    report = models.FileField(upload_to='pathology_reports/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Pathology data for {self.patient}"
