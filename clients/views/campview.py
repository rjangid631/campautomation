from rest_framework import viewsets

from clients.Serializersclient.campserializer import CampSerializer
from clients.models.camp import Camp

class CampViewSet(viewsets.ModelViewSet):
    serializer_class = CampSerializer

    def get_queryset(self):
        """
        Return filtered queryset if client_id is passed, else return all.
        This prevents errors during POST/PUT/PATCH which do not use get_queryset.
        """
        client_id = self.request.query_params.get("client_id")
        if self.request.method == 'GET' and client_id:
            return Camp.objects.filter(client__client_id=client_id)
        return Camp.objects.all()