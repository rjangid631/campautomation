from django.db import models
from clients.models.package import Package
from technician.Models.technician import Technician
from clients.models.service import Service
from clients.models.camp import Camp

class TechnicianServiceAssignment(models.Model):
    technician = models.ForeignKey(Technician, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    camp = models.ForeignKey(Camp, on_delete=models.CASCADE)
    package = models.ForeignKey(Package, on_delete=models.CASCADE, null=True, blank=True)
    class Meta:
        unique_together = ('technician', 'service', 'camp')  # Avoid duplicate assignments

    def __str__(self):
        return f"{self.technician.name} - {self.service.name} - {self.camp.location}"
