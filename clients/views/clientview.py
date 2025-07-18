from rest_framework import generics, status
from rest_framework.response import Response

from clients.models.client import Client
from clients.serializers.clientserializer import ClientSerializer

class ClientRegisterView(generics.CreateAPIView):
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    authentication_classes = []  # 🚫 Disable authentication
    permission_classes = []      # 🚫 Disable permission checks

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = serializer.save()
        return Response({
            "message": "Signup successful",
            "client_id": client.client_id,
            "email": client.email
        }, status=status.HTTP_201_CREATED)
