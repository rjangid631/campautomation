from rest_framework import viewsets, permissions
from rest_framework.exceptions import NotFound
from clients.models.client import Client
from clients.models.camp import Camp
from clients.Serializersclient.campserializer import CampSerializer

class ClientCampViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CampSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        try:
            client = Client.objects.get(email=user.email)
        except Client.DoesNotExist:
            raise NotFound("Client profile not found for this user.")

        return Camp.objects.filter(company__client=client)