from rest_framework import generics
from clients.models.client import Client
from clients.Serializersclient.clientserializer import ClientSerializer

class ClientRegisterView(generics.CreateAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer