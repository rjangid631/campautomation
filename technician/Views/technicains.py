from rest_framework import viewsets
from technician.Models.technician import Technician
from technician.serializers.technicianserializer import TechnicianSerializer
from rest_framework.decorators import api_view
from rest_framework.response import Response

class TechnicianViewSet(viewsets.ModelViewSet):
    queryset = Technician.objects.all()
    serializer_class = TechnicianSerializer

@api_view(['GET'])
def get_all_technicians(request):
    technicians = Technician.objects.all()
    serializer = TechnicianSerializer(technicians, many=True)
    return Response(serializer.data)