from rest_framework import serializers
from clients.models.package import Package
from clients.Serializersclient.Service import ServiceSerializer

class PackageSerializer(serializers.ModelSerializer):
    services = ServiceSerializer(many=True, read_only=True)

    class Meta:
        model = Package
        fields = ['id', 'client', 'name', 'services', 'start_date', 'end_date']