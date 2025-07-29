# technician/serializers/pathology_serializer.py

from rest_framework import serializers
from technician.Models.pathology import Pathology
from camp_manager.Models.Patientdata import PatientData

class PathologySerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)

    class Meta:
        model = Pathology
        fields = '__all__'
        read_only_fields = ['patient']
        extra_kwargs = {
            'patient': {'read_only': True}
        }

    def create(self, validated_data):
        unique_id = validated_data.pop('patient_unique_id')
        try:
            patient = PatientData.objects.get(unique_patient_id=unique_id)
        except PatientData.DoesNotExist:
            raise serializers.ValidationError({'patient_unique_id': 'Patient not found with this ID'})

        # Check if pathology already exists
        existing_pathology = Pathology.objects.filter(patient=patient).first()
        if existing_pathology:
            for attr, value in validated_data.items():
                setattr(existing_pathology, attr, value)
            existing_pathology.save()
            return existing_pathology

        # Create new if not exists
        return Pathology.objects.create(patient=patient, **validated_data)

