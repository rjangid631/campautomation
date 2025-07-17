# technician/serializers/servicelog.py
from rest_framework import serializers
from technician.Models.servicestatus import ServiceLog  # ✅ from servicestatus.py

class ServiceLogSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    service_name = serializers.CharField(source='service_status.service.name', read_only=True)
    patient_name = serializers.CharField(source='service_status.patient.name', read_only=True)
    completed_at = serializers.DateTimeField(format="%Y-%m-%d %H:%M")

    class Meta:
        model = ServiceLog
        fields = ['id', 'technician_name', 'patient_name', 'service_name', 'completed_at']
        read_only_fields = ['id', 'completed_at']