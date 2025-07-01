from rest_framework import serializers

class ExcelUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    camp_id = serializers.IntegerField()
    package_id = serializers.IntegerField(required=False)
