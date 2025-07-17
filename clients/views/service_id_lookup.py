# clients/views/service_id_lookup.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from clients.models.service import Service

@api_view(['GET'])
def get_service_id_by_name(request):
    name = request.GET.get('name', '').strip().lower()
    if not name:
        return Response({'error': 'Name parameter is required'}, status=400)

    try:
        service = Service.objects.get(name__iexact=name)
        return Response({'id': service.id})
    except Service.DoesNotExist:
        return Response({'error': 'Service not found'}, status=404)
