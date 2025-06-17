from rest_framework import serializers
from clients.models.serviceselection import ServiceSelection

class ServiceSelectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceSelection
        fields = ['company_id', 'packages']