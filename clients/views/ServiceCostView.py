from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from clients.Serializersclient.servicecost import ServiceCostSerializer
from clients.models.discountcoupon import DiscountCoupon
from clients.models.servicecost import ServiceCost
from rest_framework import viewsets

class ServiceCostViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCost.objects.all()
    serializer_class = ServiceCostSerializer

def validate_coupon(request, code):
    coupon = get_object_or_404(DiscountCoupon, code=code)
    return JsonResponse({
        'code': coupon.code,
        'discount_percentage': coupon.discount_percentage,
    })
