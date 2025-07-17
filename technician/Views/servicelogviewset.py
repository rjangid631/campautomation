from rest_framework.viewsets import ReadOnlyModelViewSet
from technician.Models.servicestatus import ServiceLog
from technician.serializers.servicelogserializer import ServiceLogSerializer

class ServiceLogViewSet(ReadOnlyModelViewSet):
    queryset = ServiceLog.objects.select_related(
        'technician',
        'service_status__service',
        'service_status__patient'
    ).order_by('-completed_at')  # show most recent first
    serializer_class = ServiceLogSerializer