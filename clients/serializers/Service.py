from rest_framework import serializers
from clients.models.service import Service
from clients.models.pricerange import PriceRange
from clients.serializers.pricerange import PriceRangeSerializer

class ServiceSerializer(serializers.ModelSerializer):
    price_ranges = PriceRangeSerializer(many=True, write_only=True)

    class Meta:
        model = Service
        fields = ['id', 'name', 'price_ranges']

    def create(self, validated_data):
        price_ranges_data = validated_data.pop('price_ranges', [])
        service = Service.objects.create(**validated_data)
        for price_range in price_ranges_data:
            PriceRange.objects.create(service=service, **price_range)
        return service

    def update(self, instance, validated_data):
        price_ranges_data = validated_data.pop('price_ranges', [])

        # Update service fields
        instance.name = validated_data.get('name', instance.name)
        instance.save()

        # Clear and recreate all related price_ranges
        instance.price_ranges.all().delete()
        for price_range in price_ranges_data:
            PriceRange.objects.create(service=instance, **price_range)

        return instance

    def to_representation(self, instance):
        rep = super().to_representation(instance)
        rep['price_ranges'] = PriceRangeSerializer(instance.price_ranges.all(), many=True).data
        return rep
