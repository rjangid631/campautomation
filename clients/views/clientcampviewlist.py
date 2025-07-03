from rest_framework import viewsets
from clients.models.client import Client
from clients.models.camp import Camp
from clients.Serializersclient.campserializer import CampSerializer

class ClientCampViewSet(viewsets.ModelViewSet):
    serializer_class = CampSerializer

    def get_queryset(self):
        """
        Optionally filter camps by client_id query param (only for GET).
        """
        client_id = self.request.query_params.get('client_id')
        if self.request.method == 'GET' and client_id:
            return Camp.objects.filter(client__client_id=client_id)
        return Camp.objects.all()

    def perform_create(self, serializer):
        """
        Create a camp using the 'client' field in request body.
        """
        serializer.save()
