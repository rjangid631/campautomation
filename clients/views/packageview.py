from rest_framework import viewsets
from clients.models.package import Package
from clients.serializers.packageserializer import PackageSerializer

class PackageViewSet(viewsets.ModelViewSet):
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    authentication_classes = []  # 🚫 Disable token/session authentication
    permission_classes = []      # 🚫 Allow unrestricted access (GET, POST, PUT, DELETE)
