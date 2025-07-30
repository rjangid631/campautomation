from django.db import models
from camp_manager.Models.Patientdata import PatientData

class SmartReport(models.Model):
    patient = models.OneToOneField(PatientData, on_delete=models.CASCADE, related_name='smart_report')
    final_pdf = models.FileField(upload_to='smart_reports/', null=True, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Smart Report for {self.patient.patient_name}"