from clients.Serializersclient.costsummary import CostSummarySerializer
from clients.models.costsummary import CostSummary
from rest_framework import viewsets


class CostSummaryViewSet(viewsets.ModelViewSet):
    queryset = CostSummary.objects.all()
    serializer_class = CostSummarySerializer