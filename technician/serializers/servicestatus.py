from rest_framework import serializers
from technician.Models.servicestatus import ServiceStatus
from camp_manager.Models.Patientdata import PatientData
from clients.models.service import Service
from technician.Models.technician import Technician

class ServiceStatusSerializer(serializers.ModelSerializer):
    service = serializers.StringRelatedField()
    technician = serializers.StringRelatedField()
    patient = serializers.StringRelatedField()

    class Meta:
        model = ServiceStatus
        fields = '__all__'
