# technician/views/vitals.py

from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from technician.Models.vitals import Vitals
from technician.serializers.vitalserializer import VitalsSerializer
from technician.permission import IsAssignedTechnicianForVitals
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from clients.models.service import Service

class VitalsViewSet(viewsets.ModelViewSet):
    queryset = Vitals.objects.all()
    serializer_class = VitalsSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        technician = getattr(self.request.user, 'technician', None)
        if not technician:
            return Vitals.objects.none()

        try:
            vitals_service = Service.objects.get(name__iexact="Vitals")
        except Service.DoesNotExist:
            return Vitals.objects.none()

        camp_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=vitals_service
        ).values_list('camp_id', flat=True)

        package_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=vitals_service
        ).values_list('package_id', flat=True)

        return Vitals.objects.filter(
            patient__excel_upload__camp_id__in=camp_ids,
            patient__package_id__in=package_ids
        )
