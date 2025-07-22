from rest_framework import serializers

class ReportLinkSerializer(serializers.Serializer):
    patient_name = serializers.CharField()
    report_type = serializers.CharField()
    pdf_link = serializers.URLField()
