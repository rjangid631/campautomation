from rest_framework.decorators import api_view
from rest_framework.response import Response
from technician.Models.technician import Technician
from technician.serializers.technicianserializer import TechnicianSerializer

@api_view(['GET'])
def get_all_technicians(request):
    technicians = Technician.objects.all()
    serializer = TechnicianSerializer(technicians, many=True)
    return Response(serializer.data)
