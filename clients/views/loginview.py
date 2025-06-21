from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth import authenticate
from clients.models import Client
from rest_framework.permissions import AllowAny

class ClientLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        try:
            client = Client.objects.get(email=username)

            if not client.check_password(password):
                return Response({"error": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

            token, created = Token.objects.get_or_create(user=client)

            return Response({
                "role": "customer",
                "username": client.name,
                "clientId": client.client_id,  # optional, used only for display
                "id": client.id,               # ✅ REAL PK for backend use
                "token": token.key
            })

        except Client.DoesNotExist:
            return Response({"error": "Client not found"}, status=status.HTTP_404_NOT_FOUND)
