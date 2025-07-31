from rest_framework import serializers
from camp_manager.Models.Patientdata import PatientData
from camp_manager.Models.identity import Identity

class IdentitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Identity
        fields = [
            'id',
            'document_file',
            'loan_document_file',  # ⬅️ Add this line
            'uploaded_at',
            'extracted_data'
        ]

class PatientDataSerializer(serializers.ModelSerializer):
    qr_code = serializers.ImageField(use_url=True, required=False)
    photo = serializers.ImageField(use_url=True, required=False)
    pdf_slip = serializers.FileField(use_url=True, required=False)
    
    # Nested identity data (read-only)
    identities = IdentitySerializer(many=True, read_only=True)

    class Meta:
        model = PatientData
        fields = '__all__'
