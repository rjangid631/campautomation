# technician/serializers/doctor_serializer.py

from rest_framework import serializers
from technician.Models.doctors import Doctor

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'name', 'designation', 'signature']
