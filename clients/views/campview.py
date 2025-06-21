from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

from clients.Serializersclient.campserializer import CampSerializer
from clients.models.camp import Camp

class CampViewSet(viewsets.ModelViewSet):
    queryset = Camp.objects.all()
    serializer_class = CampSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
