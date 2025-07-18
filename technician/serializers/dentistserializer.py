# technician/serializers/dentistserializer.py

from rest_framework import serializers
from technician.Models.dentist import Dentist

class DentistSerializer(serializers.ModelSerializer):
    technician_name = serializers.CharField(source='technician.name', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Dentist
        fields = ['id', 'technician', 'technician_name', 'user', 'user_email', 'name', 'designation', 'signature']
