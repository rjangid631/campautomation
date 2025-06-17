from rest_framework import viewsets, status
from rest_framework.response import Response
from clients.models.serviceselection import ServiceSelection
from clients.Serializersclient.serviceselectionserializer import ServiceSelectionSerializer

class ServiceSelectionViewSet(viewsets.ModelViewSet):
    queryset = ServiceSelection.objects.all()
    serializer_class = ServiceSelectionSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        is_many = isinstance(data, list)

        serializer = self.get_serializer(data=data, many=is_many)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        if is_many:
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        # Handles both single and multiple saves
        serializer.save()
