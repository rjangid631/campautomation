from rest_framework import serializers
from clients.models.client import Client
from clients.models.package import Package
from clients.models.service import Service  # ✅ Import the model, not the serializer
from clients.Serializersclient.Service import ServiceSerializer  # ✅ This is for nested output

class PackageSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Service.objects.all(),  # ✅ This now works correctly
        write_only=True,
        source='services'
    )

    class Meta:
        model = Package
        fields = ['id', 'client', 'name', 'services', 'service_ids', 'start_date', 'end_date']