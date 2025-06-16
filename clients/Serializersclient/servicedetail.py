
from clients.models.servicedetails import ServiceDetails
from rest_framework import serializers


class ServiceDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceDetails
        fields = ['service_name', 'total_cases']
