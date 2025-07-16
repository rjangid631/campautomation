# technician/views/doctor_viewset.py

from rest_framework import viewsets
from technician.Models.doctors import Doctor
from technician.serializers.doctor_serializer import DoctorSerializer

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
