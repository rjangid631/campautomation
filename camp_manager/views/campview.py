from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from clients.models.camp import Camp
from clients.models.package import Package
from camp_manager.Models.Patientdata import PatientData
from clients.Serializersclient.campserializer import CampSerializer
from clients.Serializersclient.packageserializer import PackageSerializer
from camp_manager.Serializers.patientdataserializer import PatientDataSerializer


class CampManagerViewSet(viewsets.ViewSet):
    def list(self, request):
        camps = Camp.objects.all()
        serializer = CampSerializer(camps, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], url_path='details')
    def details(self, request, pk=None):
        try:
            camp = Camp.objects.get(id=pk)
            camp_data = CampSerializer(camp).data
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
