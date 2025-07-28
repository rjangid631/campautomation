from django.db import models
from camp_manager.Models.Patientdata import PatientData

class Identity(models.Model):
    patient = models.ForeignKey(PatientData, on_delete=models.CASCADE, related_name='identities')
    document_file = models.FileField(upload_to='identity_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    # Optional: store structured data extracted from OCR
    extracted_data = models.JSONField(null=True, blank=True, help_text="OCR extracted info, if any")

    def __str__(self):
        return f"{self.patient.patient_name} - Identity Document"
