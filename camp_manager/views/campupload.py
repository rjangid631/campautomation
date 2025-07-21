# reports/views.py
from rest_framework import generics
from camp_manager.Models.Camp_report import CampReport
from camp_manager.Serializers.reportsserializer import CampReportSerializer
from rest_framework.permissions import AllowAny

class CampReportUploadView(generics.CreateAPIView):
    queryset = CampReport.objects.all()
    serializer_class = CampReportSerializer
    permission_classes = [AllowAny]

class CampReportDetailView(generics.RetrieveAPIView):
    queryset = CampReport.objects.all()
    serializer_class = CampReportSerializer
    permission_classes = [AllowAny]
    lookup_field = 'camp__id'  # e.g. ?camp__id=12
