from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import AllowAny
from clients.models import Client

class ClientLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("email") or request.data.get("username")
        password = request.data.get("password")

        print("🟡 Received login:", username, password)

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            client = Client.objects.get(email=username)

            if not client.check_password(password):
                return Response({"detail": "Invalid password"}, status=status.HTTP_401_UNAUTHORIZED)

            refresh = RefreshToken.for_user(client)
            access = refresh.access_token

            response_data = {
                "access": str(access),
                "refresh": str(refresh),
                "login_type": client.login_type or "Client",
                "name": client.name,
                "client_id": client.client_id or "",
                "user_id": client.id,
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Client.DoesNotExist:
            return Response({"detail": "Client not found"}, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
