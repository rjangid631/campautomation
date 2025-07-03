from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from django.contrib.auth import authenticate
from clients.models import Client
from rest_framework.permissions import AllowAny

class ClientLoginView(APIView):
    permission_classes = [AllowAny]  # Public login endpoint

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"detail": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Use custom authentication logic since `Client` is custom user
            client = Client.objects.get(email=username)

            if not client.check_password(password):  # ✅ use check_password method
                return Response({"detail": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

            return Response({
                "role": client.login_type.lower(),  # 'client' or 'coordinator'
                "username": client.name,
                "clientId": client.client_id,
                "id": client.id
            }, status=status.HTTP_200_OK)

        except Client.DoesNotExist:
            return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
