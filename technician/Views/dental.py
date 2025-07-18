from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from technician.Models.dentalconsultation import DentalConsultation
from technician.serializers.dentalconsultationserializer import DentalConsultationSerializer
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from clients.models.service import Service

class DentalConsultationViewSet(viewsets.ModelViewSet):
    queryset = DentalConsultation.objects.all()
    serializer_class = DentalConsultationSerializer
    permission_classes = [AllowAny]  # Replace with IsAuthenticated & custom permission in production

    def get_queryset(self):
        technician = getattr(self.request.user, 'technician', None)
        if not technician:
            return DentalConsultation.objects.none()

        try:
            dental_service = Service.objects.get(name__iexact="Dental")
        except Service.DoesNotExist:
            return DentalConsultation.objects.none()

        camp_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=dental_service
        ).values_list('camp_id', flat=True)

        package_ids = TechnicianServiceAssignment.objects.filter(
            technician=technician,
            service=dental_service
        ).values_list('package_id', flat=True)

        return DentalConsultation.objects.filter(
            patient__excel_upload__camp_id__in=camp_ids,
            patient__package_id__in=package_ids
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        return Response(self.get_serializer(instance).data)
