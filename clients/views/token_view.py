from rest_framework_simplejwt.views import TokenObtainPairView
from clients.serializers.custom_token import CustomTokenObtainPairSerializer

class CustomLoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer