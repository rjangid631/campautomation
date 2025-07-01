from rest_framework import viewsets
from clients.models.client import Client  # Adjust import if needed
from clients.Serializersclient.clientserializer import ClientSerializer  # Adjust if named differently
from rest_framework.permissions import IsAuthenticated

class ClientViewSet(viewsets.ReadOnlyModelViewSet):  # Only GET methods
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]  # Optional: only authenticated users can access
