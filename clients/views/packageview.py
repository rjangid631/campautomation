from rest_framework import viewsets
from clients.models.package import Package
from clients.Serializersclient.packageserializer import PackageSerializer
from rest_framework.permissions import IsAuthenticatedOrReadOnly

class PackageViewSet(viewsets.ModelViewSet):
    queryset = Package.objects.all()
    serializer_class = PackageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]