from rest_framework import serializers
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment

class TechnicianServiceAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TechnicianServiceAssignment
        fields = '__all__'