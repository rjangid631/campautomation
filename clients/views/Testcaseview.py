from rest_framework import viewsets, status
from rest_framework.response import Response
from clients.models.testdata import TestData
from clients.serializers.testcasedata import TestCaseDataSerializer

class TestCaseDataViewSet(viewsets.ModelViewSet):
    queryset = TestData.objects.all()
    serializer_class = TestCaseDataSerializer

    def create(self, request, *args, **kwargs):
        data = request.data

        # Check if it's a list (bulk create)
        if isinstance(data, list):
            serializer = self.get_serializer(data=data, many=True)
        else:
            serializer = self.get_serializer(data=data)

        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        return Response(serializer.data, status=status.HTTP_201_CREATED)