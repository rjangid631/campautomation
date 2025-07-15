from clients.models.service import Service
from technician.Models.doctorconsultation import DoctorConsultation
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from technician.permission import IsAssignedTechnicianForDoctorConsultation
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets

from technician.serializers.doctorconsultationserializer import DoctorConsultationSerializer

class DoctorConsultationViewSet(viewsets.ModelViewSet):
    queryset = DoctorConsultation.objects.all()
    serializer_class = DoctorConsultationSerializer
    permission_classes = [AllowAny]  # Use IsAuthenticated + IsAssignedTechnicianForDoctorConsultation for security

    def get_queryset(self):
        technician = getattr(self.request.user, 'technician', None)
        if not technician:
            return DoctorConsultation.objects.none()

        try:
            consultation_service = Service.objects.get(name__iexact="Doctor Consultation")
        except Service.DoesNotExist:
            return DoctorConsultation.objects.none()

        camp_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=consultation_service
        ).values_list('camp_id', flat=True)

        package_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=consultation_service
        ).values_list('package_id', flat=True)

        return DoctorConsultation.objects.filter(
            patient__excel_upload__camp_id__in=camp_ids,
            patient__package_id__in=package_ids
        )
