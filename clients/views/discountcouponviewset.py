from rest_framework import viewsets
from clients.models.discountcoupon import DiscountCoupon  # Adjust the import path if needed
from clients.serializers.discountcouponserializer import DiscountCouponSerializer

class DiscountCouponViewSet(viewsets.ModelViewSet):  # Only GET (safe)
    queryset = DiscountCoupon.objects.all()
    serializer_class = DiscountCouponSerializer
