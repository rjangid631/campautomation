# technician/serializers/doctor_serializer.py

from rest_framework import serializers
from technician.Models.doctors import Doctor
from clients.serializers.clientserializer import ClientSerializer  # import if needed
from technician.serializers.technicianserializer import TechnicianSerializer  # import if needed

class DoctorSerializer(serializers.ModelSerializer):
    user = ClientSerializer(read_only=True)  # Optional: to show full user details
    technician = TechnicianSerializer(read_only=True)  # Optional

    class Meta:
        model = Doctor
        fields = ['id', 'name', 'designation', 'signature', 'user', 'technician']
