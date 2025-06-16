
from rest_framework import viewsets

from clients.Serializersclient.companyserializer import CompanySerializer
from clients.models.company import Company

class CompanyViewSet(viewsets.ModelViewSet):
    queryset = Company.objects.all()
    serializer_class = CompanySerializer