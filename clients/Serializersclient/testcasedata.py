from rest_framework import serializers
from clients.models.testdata import TestData

class TestCaseDataSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestData
        fields = ['company_id', 'service_name', 'case_per_day', 'number_of_days', 'total_case']