from rest_framework import serializers
from technician.Models.doctors import Doctor

class DoctorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Doctor
        fields = ['id', 'user', 'technician', 'name', 'designation', 'signature']
