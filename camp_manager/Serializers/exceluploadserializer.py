from camp_manager.Models.Upload_excel import ExcelUpload
from rest_framework import serializers


class ExcelUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExcelUpload
        fields = '__all__'