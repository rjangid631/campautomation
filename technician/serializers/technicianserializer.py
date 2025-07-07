from rest_framework import serializers
from technician.Models.technician import Technician

class TechnicianSerializer(serializers.ModelSerializer):
    class Meta:
        model = Technician
        fields = ['id', 'name', 'email']  # Include other fields like phone if needed
