from rest_framework import serializers
from clients.models.client import Client
from clients.models.package import Package
from clients.models.testdata import TestData
from clients.models.testtype import TestType

class TestTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TestType
        fields = ['id', 'name']

class TestCaseDataSerializer(serializers.ModelSerializer):
    client = serializers.SlugRelatedField(
        slug_field='client_id',
        queryset=Client.objects.all()
    )
    client_name = serializers.CharField(source='client.name', read_only=True)
    total_case = serializers.IntegerField(read_only=True)
    report_type = serializers.SlugRelatedField(
        slug_field='name',
        queryset=TestType.objects.all()
    )
    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = TestData
        fields = [
            'id',
            'client',
            'client_name',
            'package',
            'service_name',
            'case_per_day',
            'number_of_days',
            'total_case',
            'report_type',         # ✅ now linked
            'report_type_cost',
        ]
