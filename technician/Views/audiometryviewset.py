from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from technician.Models.audiometry import Audiometry
from technician.serializers.audiometryserializer import AudiometrySerializer
from technician.permission import IsAssignedTechnicianForAudiometry
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from clients.models.service import Service
from rest_framework.parsers import MultiPartParser, FormParser

class AudiometryViewSet(viewsets.ModelViewSet):
    queryset = Audiometry.objects.all() # This will be filtered in get_queryset
    serializer_class = AudiometrySerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        technician = getattr(self.request.user, 'technician', None)
        if not technician:
            return Audiometry.objects.none()

        try:
            audiometry_service = Service.objects.get(name__iexact="Audiometry")
        except Service.DoesNotExist:
            return Audiometry.objects.none()

        camp_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=audiometry_service
        ).values_list('camp_id', flat=True)

        package_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=audiometry_service
        ).values_list('package_id', flat=True)

        return Audiometry.objects.filter(
            patient__excel_upload__camp_id__in=camp_ids,
            patient__package_id__in=package_ids
        )
