from clients.Serializersclient.serviceselectionserializer import ServiceSelectionSerializer
from clients.models.serviceselection import ServiceSelection
from rest_framework import viewsets

class ServiceSelectionViewSet(viewsets.ModelViewSet):
    queryset = ServiceSelection.objects.all()
    serializer_class = ServiceSelectionSerializer
    