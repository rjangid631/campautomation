from rest_framework import viewsets
from clients.models.client import Client
from clients.Serializersclient.clientserializer import ClientSerializer

class ClientViewSet(viewsets.ReadOnlyModelViewSet):  # Only supports GET (list/retrieve)
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    authentication_classes = []  # 🔓 No authentication required
    permission_classes = []      # 🔓 No permissions enforced
