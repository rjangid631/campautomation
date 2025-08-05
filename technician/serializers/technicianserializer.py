from rest_framework import serializers
from technician.Models.technician import Technician
from clients.models.camp import Camp
from clients.models.service import Service
from django.contrib.auth import get_user_model

User = get_user_model()

class TechnicianSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    camps = serializers.PrimaryKeyRelatedField(queryset=Camp.objects.all(), many=True)
    services = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all(), many=True)
    
    # Optional: include user details for read-only display
    # name = serializers.SerializerMethodField()
    # email = serializers.SerializerMethodField()

    class Meta:
        model = Technician
        fields = ['id', 'user', 'camps', 'services',]

    # def get_name(self, obj):
    #     return obj.user.name if obj.user else None

    # def get_email(self, obj):
    #     return obj.user.email if obj.user else None
