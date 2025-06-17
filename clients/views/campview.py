from rest_framework import viewsets
from clients.Serializersclient.campserializer import CampSerializer
from clients.models.camp import Camp

class CampViewSet(viewsets.ModelViewSet):
    queryset = Camp.objects.all()
    serializer_class = CampSerializer