from rest_framework import viewsets
from clients.models.camp import Camp
from clients.serializers.campserializer import CampSerializer

class CampViewSet(viewsets.ModelViewSet):
    """
    API endpoint to view or edit Camp instances.
    - Supports filtering by client_id via GET request.
    """
    serializer_class = CampSerializer
    queryset = Camp.objects.all()

    def get_queryset(self):
        """
        Filters queryset by client_id query param (GET only).
        """
        queryset = super().get_queryset()
        client_id = self.request.query_params.get("client_id")

        if self.request.method == 'GET' and client_id:
            return queryset.filter(client__client_id=client_id)

        return queryset
