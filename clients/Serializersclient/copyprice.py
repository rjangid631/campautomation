from clients.models.copyprice import CopyPrice
from rest_framework import serializers


class CopyPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model=CopyPrice
        fields = '__all__'
