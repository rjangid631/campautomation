from camp_manager.Models.Patientdata import PatientData
from rest_framework import serializers


class PatientDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientData
        fields = '__all__'