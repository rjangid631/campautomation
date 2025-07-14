from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from technician.Models.optometry import Optometry
from technician.serializers.OptometrySerializer import OptometrySerializer
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from clients.models.service import Service

class OptometryViewSet(viewsets.ModelViewSet):
    queryset = Optometry.objects.all()
    serializer_class = OptometrySerializer
    permission_classes = [AllowAny]  # Use IsAuthenticated + IsAssignedTechnicianForOptometry for security

    def get_queryset(self):
        technician = getattr(self.request.user, 'technician', None)
        if not technician:
            return Optometry.objects.none()

        try:
            optometry_service = Service.objects.get(name__iexact="Optometry")
        except Service.DoesNotExist:
            return Optometry.objects.none()

        camp_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=optometry_service
        ).values_list('camp_id', flat=True)

        package_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=optometry_service
        ).values_list('package_id', flat=True)

        return Optometry.objects.filter(
            patient__excel_upload__camp_id__in=camp_ids,
            patient__package_id__in=package_ids
        )
