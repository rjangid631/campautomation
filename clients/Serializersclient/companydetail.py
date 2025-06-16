from clients.Serializersclient.servicedetail import ServiceDetailsSerializer
from clients.models.companydetails import CompanyDetails
from clients.models.servicedetails import ServiceDetails
from rest_framework import serializers

class CompanyDetailsSerializer(serializers.ModelSerializer):
    services = ServiceDetailsSerializer(many=True)

    class Meta:
        model = CompanyDetails
        fields = ['company_name', 'grand_total', 'services','super_company']

    def create(self, validated_data):
        services_data = validated_data.pop('services')
        company = CompanyDetails.objects.create(**validated_data)
        for service_data in services_data:
            ServiceDetails.objects.create(company=company, **service_data)
        return company