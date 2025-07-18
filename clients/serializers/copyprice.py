from rest_framework import serializers
from clients.models.copyprice import CopyPrice

class CopyPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CopyPrice
        fields = '__all__'