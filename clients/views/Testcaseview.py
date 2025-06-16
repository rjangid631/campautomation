from clients.Serializersclient.testcasedata import TestCaseDataSerializer
from clients.models.testdata import TestData
from rest_framework import viewsets, status
from rest_framework.response import Response

class TestCaseDataViewSet(viewsets.ModelViewSet):
    queryset = TestData.objects.all()
    serializer_class = TestCaseDataSerializer

    def create(self, request, *args, **kwargs):
        data = request.data
        # Ensure data is a list of objects
        if not isinstance(data, list):
            return Response({"detail": "Invalid data format. Expected a list of objects."}, status=status.HTTP_400_BAD_REQUEST)

        # Use the serializer to validate and save the data
        serializer = self.get_serializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def list(self, request, *args, **kwargs):
        # Default implementation provided by ModelViewSet
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        # Default implementation provided by ModelViewSet
        return super().retrieve(request, *args, **kwargs)
    