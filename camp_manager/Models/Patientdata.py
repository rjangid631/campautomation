from django.db import models
from camp_manager.Models.Upload_excel import ExcelUpload

class PatientData(models.Model):
    excel_upload = models.ForeignKey(ExcelUpload, on_delete=models.CASCADE, related_name='patients')
    patient_excel_id = models.CharField(max_length=50, blank=True, null=True)
    unique_patient_id = models.CharField(max_length=20, unique=True)  # System generated

    patient_name = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=10)
    contact_number = models.CharField(max_length=15)
    service = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.patient_name} ({self.unique_patient_id})"
