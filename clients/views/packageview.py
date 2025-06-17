from clients.Serializersclient.packageserializer import PackageSerializer
from clients.models.package import Package
from rest_framework import viewsets


class PackageViewSet(viewsets.ModelViewSet):
    queryset = Package.objects.all()
    serializer_class = PackageSerializer