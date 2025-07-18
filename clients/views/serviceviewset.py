from clients.serializers.Service import ServiceSerializer
from clients.models.service import Service
from rest_framework import viewsets


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer