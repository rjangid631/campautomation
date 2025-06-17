from rest_framework import serializers
from clients.models.testdata import TestData

class TestCaseDataSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)  # Optional: for display

    class Meta:
        model = TestData
        fields = [
            'id',
            'client',         # updated from 'company_id'
            'client_name',    # optional, for display in API
            'service_name',
            'case_per_day',
            'number_of_days',
            'total_case',
        ]