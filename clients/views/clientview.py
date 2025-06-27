from rest_framework import generics
from clients.models.client import Client
from clients.Serializersclient.clientserializer import ClientSerializer

class ClientRegisterView(generics.CreateAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = serializer.save()
        return Response({
            "message": "Signup successful",
            "client_id": client.client_id,
            "email": client.email
        }, status=status.HTTP_201_CREATED)