from rest_framework import serializers
from clients.models.discountcoupon import DiscountCoupon  # Adjust the import path if needed

class DiscountCouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCoupon
        fields = ['id', 'code', 'discount_percentage']
