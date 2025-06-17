from rest_framework import viewsets
from clients.models.serviceselection import ServiceSelection
from clients.Serializersclient.serviceselectionserializer import ServiceSelectionSerializer

class ServiceSelectionViewSet(viewsets.ModelViewSet):
    queryset = ServiceSelection.objects.all()
    serializer_class = ServiceSelectionSerializer