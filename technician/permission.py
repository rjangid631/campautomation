from rest_framework import permissions
from clients.models.service import Service
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from django.core.exceptions import ObjectDoesNotExist

class IsAssignedTechnicianForAudiometry(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        technician = getattr(request.user, 'technician', None)
        if technician is None:
            return False

        try:
            audiometry_service = Service.objects.get(name__iexact="Audiometry")
        except Service.DoesNotExist:
            return False

        try:
            camp = obj.patient.excel_upload.camp
            package = obj.patient.package
        except AttributeError:
            return False

        return TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=audiometry_service,
            camp=camp,
            package=package
        ).exists()
