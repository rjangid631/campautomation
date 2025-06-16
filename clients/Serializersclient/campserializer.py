from rest_framework import serializers
from clients.models.camp import Camp

class CampSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camp
        fields = '__all__'
