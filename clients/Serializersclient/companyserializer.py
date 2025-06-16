from rest_framework import serializers
from clients.Serializersclient.campserializer import CampSerializer
from clients.models.company import Company

class CompanySerializer(serializers.ModelSerializer):
    camps = CampSerializer(many=True, read_only=True)
    
    class Meta:
        model = Company
        fields = '__all__'