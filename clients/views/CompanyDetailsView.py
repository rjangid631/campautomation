from clients.Serializersclient.companydetail import CompanyDetailsSerializer
from clients.models.companydetails import CompanyDetails
from rest_framework import viewsets

class CompanyDetailsViewSet(viewsets.ModelViewSet):
    queryset = CompanyDetails.objects.all()
    serializer_class = CompanyDetailsSerializer
