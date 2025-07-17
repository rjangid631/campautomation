from django.db import models
from camp_manager.Models.Patientdata import PatientData
from clients.models.service import Service
from technician.Models.technician import Technician

class ServiceStatus(models.Model):
    patient = models.ForeignKey(PatientData, on_delete=models.CASCADE, related_name='service_statuses')
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    technician = models.ForeignKey(Technician, on_delete=models.SET_NULL, null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('patient', 'service')
    
    def __str__(self):
        return f"{self.patient.patient_name} - {self.service.name} ({'Completed' if self.is_completed else 'Pending'})"

class ServiceLog(models.Model):
    service_status = models.ForeignKey(ServiceStatus, on_delete=models.CASCADE)
    technician = models.ForeignKey(Technician, on_delete=models.SET_NULL, null=True)
    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        tech_name = self.technician.name if self.technician else "No Technician"
        return f"{tech_name} - {self.service_status} at {self.completed_at.strftime('%Y-%m-%d %H:%M')}"
