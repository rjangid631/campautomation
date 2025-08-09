from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from clients.models.camp import Camp
from clients.models.package import Package
from camp_manager.Models.Patientdata import PatientData
from clients.serializers.campserializer import CampSerializer
from clients.serializers.packageserializer import PackageSerializer
from camp_manager.Serializers.patientdataserializer import PatientDataSerializer


class CampManagerViewSet(viewsets.ModelViewSet):
    queryset = Camp.objects.all()
    serializer_class = CampSerializer

    def list(self, request):
        camps = Camp.objects.all()
        serializer = self.get_serializer(camps, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='details')
    def details(self, request, pk=None):
        try:
            camp = self.get_object()
            camp_data = self.get_serializer(camp).data
            packages = Package.objects.filter(camp_id=camp.id)
            package_data = PackageSerializer(packages, many=True).data
            return Response({"camp": camp_data, "packages": package_data})
        except Camp.DoesNotExist:
            return Response({"error": "Camp not found"}, status=404)

    @action(detail=True, methods=['get'], url_path='patients')
    def patients(self, request, pk=None):
        patients = PatientData.objects.filter(excel_upload__camp_id=pk)
        serializer = PatientDataSerializer(patients, many=True)
        return Response(serializer.data)
