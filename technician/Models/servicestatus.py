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