from rest_framework import serializers
from clients.models.service import Service
from clients.Serializersclient.pricerange import PriceRangeSerializer

class ServiceSerializer(serializers.ModelSerializer):
    price_ranges = PriceRangeSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = ['name', 'price_ranges']