from rest_framework import viewsets
from rest_framework.exceptions import NotFound
from clients.models.client import Client
from clients.models.camp import Camp
from clients.Serializersclient.campserializer import CampSerializer

class ClientCampViewSet(viewsets.ModelViewSet):  # or ReadOnlyModelViewSet for safer access
    serializer_class = CampSerializer

    def get_queryset(self):
        client_id = self.request.query_params.get('client_id')

        if not client_id:
            raise NotFound("Missing client_id in request parameters.")

        try:
            client = Client.objects.get(client_id=client_id)  # change to your actual field (e.g., id or client_id)
        except Client.DoesNotExist:
            raise NotFound(f"No client found with ID: {client_id}")

        return Camp.objects.filter(client=client)

    def perform_create(self, serializer):
        """
        Automatically associate the camp with client using client_id from query params.
        """
        client_id = self.request.query_params.get('client_id')

        if not client_id:
            raise NotFound("Missing client_id in request parameters.")

        try:
            client = Client.objects.get(client_id=client_id)  # change to actual field name
        except Client.DoesNotExist:
            raise NotFound(f"No client found with ID: {client_id}")

        serializer.save(client=client)
