from rest_framework import viewsets
from camp_manager.Models.Patientdata import PatientData
from camp_manager.Models.identity import Identity
from camp_manager.Serializers.patientdataserializer import PatientDataSerializer, IdentitySerializer

class PatientDataViewSet(viewsets.ModelViewSet):
    queryset = PatientData.objects.all()
    serializer_class = PatientDataSerializer

class IdentityViewSet(viewsets.ModelViewSet):
    queryset = Identity.objects.all()
    serializer_class = IdentitySerializer
