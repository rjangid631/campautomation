from clients.Serializersclient.userserializer import UserSerializer
from clients.models.user import User
from rest_framework import viewsets


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer