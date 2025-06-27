from rest_framework import serializers
from clients.models.pricerange import PriceRange

class PriceRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceRange
        fields = ['max_cases', 'price']
