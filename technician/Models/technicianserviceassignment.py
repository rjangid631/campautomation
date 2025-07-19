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
        unique_together = ('technician', 'service', 'camp')

    def __str__(self):
        tech_name = self.technician.user.name if self.technician.user else f"Tech #{self.technician.id}"
        return f"{tech_name} - {self.service.name} - {self.camp.location}"