# technician/serializers/technicianserializer.py
from rest_framework import serializers
from technician.Models.technician import Technician

class TechnicianSerializer(serializers.ModelSerializer):
    name  = serializers.CharField(source='user.name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model   = Technician
        fields  = ['id', 'name', 'email']