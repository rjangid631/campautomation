# camp_manager/views.py
from rest_framework.generics import CreateAPIView
from camp_manager.Models.Patientdata import PatientData
from camp_manager.Serializers.campcreateserializer import PatientCreateSerializer


class AddPatientView(CreateAPIView):
    """
    POST /api/campmanager/patients/
    No authentication or permission classes shown – add as needed.
    """
    queryset         = PatientData.objects.all()
    serializer_class = PatientCreateSerializer