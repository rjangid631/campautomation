from rest_framework import serializers
from clients.serializers.pricerange import PriceRangeSerializer
from clients.models.service import Service

class ServiceSerializer(serializers.ModelSerializer):
    price_ranges = PriceRangeSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = ['id', 'name', 'price_ranges']