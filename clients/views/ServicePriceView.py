from clients.Serializersclient.Service import ServiceSerializer
from clients.models.service import Service
from rest_framework.response import Response
from rest_framework.views import APIView

class ServicePriceView(APIView):
    def get(self, request):
        services = Service.objects.all()
        serializer = ServiceSerializer(services, many=True)
        return Response(serializer.data)