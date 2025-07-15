from django.db import models
from  camp_manager.Models.Patientdata import PatientData
from technician.Models.doctors import Doctor

class DoctorConsultation(models.Model):
    YES_NO_CHOICES = [('Yes', 'Yes'), ('No', 'No')]
    
    patient = models.ForeignKey(PatientData, on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.SET_NULL, null=True, blank=True)
    
    has_medical_conditions = models.CharField(max_length=3, choices=YES_NO_CHOICES, default='No')
    medical_conditions = models.TextField(blank=True, null=True)

    has_medications = models.CharField(max_length=3, choices=YES_NO_CHOICES, default='No')
    medications = models.TextField(blank=True, null=True)

    has_allergies = models.CharField(max_length=3, choices=YES_NO_CHOICES, default='No')
    allergies = models.TextField(blank=True, null=True)

    chief_complaint = models.TextField(blank=True, null=True)
    history = models.TextField(blank=True, null=True)
    diagnostic_tests = models.TextField(blank=True, null=True)
    advice = models.TextField(blank=True, null=True)

    fitness_status = models.CharField(max_length=10, choices=[('FIT', 'FIT'), ('UNFIT', 'UNFIT')])
    unfit_reason = models.TextField(blank=True, null=True)

    pdf_report = models.FileField(upload_to='consultation_reports/', null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Consultation for {self.patient.patient_name} by Dr. {self.doctor}"
