# camp_manager/serializers.py
from rest_framework import serializers
from camp_manager.Models.Patientdata import PatientData


class PatientCreateSerializer(serializers.ModelSerializer):
    """
    Fields exposed to the API.
    The internal 'unique_patient_id' is NOT in this list – it is filled in the view.
    """
    patient_id   = serializers.CharField(source='patient_excel_id')
    name         = serializers.CharField(source='patient_name')
    phone        = serializers.CharField(source='contact_number')
    services     = serializers.ListField(
        child=serializers.CharField(), write_only=True
    )

    class Meta:
        model  = PatientData
        fields = [
            'patient_id', 'name', 'age', 'gender',
            'phone', 'services', 'package_id', 'camp_id'
        ]
        extra_kwargs = {
            'package_id': {'write_only': True},
            'camp_id'   : {'write_only': True},
        }

    def create(self, validated_data):
        """
        1. Extract camp_id & package_id
        2. Find the matching ExcelUpload
        3. Generate unique_patient_id
        4. Create the PatientData row
        """
        from django.utils.crypto import get_random_string
        from camp_manager.Models.Upload_excel import ExcelUpload

        camp_id    = validated_data.pop('camp_id')
        package_id = validated_data.pop('package_id')

        excel_upload = ExcelUpload.objects.filter(
            camp_id=camp_id, package_id=package_id
        ).first()

        if not excel_upload:
            raise serializers.ValidationError(
                {'non_field_errors': ['Invalid camp / package combination.']}
            )

        validated_data['excel_upload']      = excel_upload
        validated_data['unique_patient_id'] = get_random_string(8).upper()
        validated_data['service']           = ', '.join(validated_data.pop('services'))

        return super().create(validated_data)