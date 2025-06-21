from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from clients.models.client import Client

@api_view(['GET'])
@permission_classes([AllowAny])
# @permission_classes([IsAuthenticated])
def get_client_id(request):
    email = request.user.email  # pull from logged-in user

    try:
        client = Client.objects.get(email=email)
        return Response({"client_id": client.id})
    except Client.DoesNotExist:
        return Response({"error": "Client not found"}, status=404)