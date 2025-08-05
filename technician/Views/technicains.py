from rest_framework import viewsets
from technician.Models.technician import Technician
from technician.serializers.technicianserializer import TechnicianSerializer

class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer
