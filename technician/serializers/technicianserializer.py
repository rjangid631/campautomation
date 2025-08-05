from rest_framework import serializers
from technician.Models.technician import Technician
from clients.models.camp import Camp
from clients.models.service import Service
from django.contrib.auth import get_user_model

User = get_user_model()

# Nested serializers
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'name', 'email']  # Adjust fields as needed

class CampSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camp
        fields = ['id', 'name', 'location']  # Adjust fields

class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name']  # Adjust fields

class TechnicianSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True, source='user')

    camps = CampSerializer(many=True, read_only=True)
    camp_ids = serializers.PrimaryKeyRelatedField(queryset=Camp.objects.all(), many=True, write_only=True, source='camps')

    services = ServiceSerializer(many=True, read_only=True)
    service_ids = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), many=True, write_only=True, source='services')

    class Meta:
        model = Technician
        fields = [
            'id',
            'user', 'user_id',
            'camps', 'camp_ids',
            'services', 'service_ids',
        ]
