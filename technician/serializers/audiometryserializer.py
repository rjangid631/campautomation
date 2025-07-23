from rest_framework import serializers
from technician.Models.audiometry import Audiometry
from camp_manager.Models.Patientdata import PatientData
from technician.Models.audiometrist import Audiometrist


class AudiometrySerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)
    technician_id     = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model  = Audiometry
        fields = '__all__'
        read_only_fields = ['patient']

    # ------------------------------------------------------------------
    # helper: map technician_id → audiometrist (same pattern as Optometry)
    # ------------------------------------------------------------------
    def get_audiometrist_from_technician(self, technician_id):
        try:
            return Audiometrist.objects.get(technician_id=technician_id)
        except Audiometrist.DoesNotExist:
            return None

    # ------------------------------------------------------------------
    # CREATE
    # ------------------------------------------------------------------
    def create(self, validated_data):
        patient_unique_id = validated_data.pop('patient_unique_id')
        technician_id     = validated_data.pop('technician_id', None)

        try:
            patient = PatientData.objects.get(unique_patient_id=patient_unique_id)
        except PatientData.DoesNotExist:
            raise serializers.ValidationError({"patient_unique_id": "Invalid or not found."})

        validated_data['patient'] = patient

        # auto-resolve audiometrist if technician_id provided
        if technician_id and 'audiometrist' not in validated_data:
            audiometrist = self.get_audiometrist_from_technician(technician_id)
            if audiometrist:
                validated_data['audiometrist'] = audiometrist

        # update-or-create pattern
        existing = Audiometry.objects.filter(patient=patient).first()
        if existing:
            # preserve existing audiometrist if none sent
            if 'audiometrist' not in validated_data:
                validated_data['audiometrist'] = existing.audiometrist

            for attr, value in validated_data.items():
                setattr(existing, attr, value)
            existing.save()
            return existing

        return super().create(validated_data)

    # ------------------------------------------------------------------
    # UPDATE
    # ------------------------------------------------------------------
    def update(self, instance, validated_data):
        validated_data.pop('patient_unique_id', None)
        validated_data.pop('technician_id', None)

        # preserve existing audiometrist if none sent
        if 'audiometrist' not in validated_data:
            validated_data['audiometrist'] = instance.audiometrist

        return super().update(instance, validated_data)