from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from clients.models.client import Client
from clients.serializers.clientdashboardserializer import ClientDashboardSerializer

class ClientDashboardView(APIView):
    authentication_classes = []  # 🚫 Disable authentication
    permission_classes = []      # 🚫 Disable permissions

    def get(self, request):
        client_id = request.query_params.get("client_id")
        
        if not client_id:
            return Response(
                {"detail": "client_id query parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = Client.objects.get(client_id=client_id)  # Change to `id` if needed
            serializer = ClientDashboardSerializer(client)
            return Response([serializer.data], status=status.HTTP_200_OK)
        except Client.DoesNotExist:
            return Response(
                {"detail": "Client not found."},
                status=status.HTTP_404_NOT_FOUND
            )
