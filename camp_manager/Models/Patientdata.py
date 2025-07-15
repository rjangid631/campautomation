# camp_manager/Models/Patientdata.py

from django.db import models
from camp_manager.Models.Upload_excel import ExcelUpload

class PatientData(models.Model):
    excel_upload = models.ForeignKey(ExcelUpload, on_delete=models.CASCADE, related_name='patients')
    patient_excel_id = models.CharField(max_length=50, blank=True, null=True)
    unique_patient_id = models.CharField(max_length=20, unique=True)
    
    patient_name = models.CharField(max_length=255)
    age = models.IntegerField()
    gender = models.CharField(max_length=10)
    contact_number = models.CharField(max_length=15)
    service = models.CharField(max_length=500)
    package = models.ForeignKey("clients.Package", on_delete=models.CASCADE, related_name="patients", null=True, blank=True)
    checked_in = models.BooleanField(default=False)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True, null=True)
    pdf_slip = models.FileField(upload_to='pdf_slips/', null=True, blank=True)
    test_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.patient_name} ({self.unique_patient_id})"
