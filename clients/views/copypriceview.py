from clients.Serializersclient.copyprice import CopyPriceSerializer
from clients.models.copyprice import CopyPrice
from rest_framework import viewsets

class CopyPriceViewSet(viewsets.ModelViewSet):
      queryset = CopyPrice.objects.all()
      serializer_class = CopyPriceSerializer
