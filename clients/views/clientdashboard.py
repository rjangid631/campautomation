from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from clients.models.client import Client
from clients.Serializersclient.clientdashboardserializer import ClientDashboardSerializer

class ClientDashboardView(APIView):
    def get(self, request):
        client_id = request.query_params.get("client_id")
        
        if client_id:
            try:
                client = Client.objects.get(client_id=client_id)
                serializer = ClientDashboardSerializer(client)
                return Response([serializer.data], status=status.HTTP_200_OK)
            except Client.DoesNotExist:
                return Response({"detail": "Client not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            return Response({"detail": "client_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
