from rest_framework import serializers
from clients.models.servicedetails import ServiceDetails

class ServiceDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceDetails
        fields = ['service_name', 'total_cases']