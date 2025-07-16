from rest_framework import viewsets
from technician.Models.optometrists import Optometrist
from technician.serializers.optometristserializer import OptometristSerializer

class OptometristViewSet(viewsets.ModelViewSet):
    queryset = Optometrist.objects.all()
    serializer_class = OptometristSerializer
