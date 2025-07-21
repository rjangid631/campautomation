# reports/serializers.py
from rest_framework import serializers
from camp_manager.Models.Camp_report import CampReport

class CampReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampReport
        fields = ['id', 'camp', 'google_drive_link', 'uploaded_at']
