import uuid
import pandas as pd
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser
from clients.models.camp import Camp
from clients.models.package import Package
from camp_manager.Models.Upload_excel import ExcelUpload
from camp_manager.Models.Patientdata import PatientData
from camp_manager.Serializers.exceluploadserializer import  ExcelUploadSerializer  # Add this import

class UploadExcelViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser]

    @action(detail=False, methods=['post'], url_path='upload-excel')
    def upload_excel(self, request):
        serializer = ExcelUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        file = serializer.validated_data['file']
        camp_id = serializer.validated_data['camp_id']
        package_id = serializer.validated_data['package_id']

        try:
            camp = Camp.objects.get(id=camp_id)
            package = Package.objects.get(id=package_id)

            unique_excel_id = str(uuid.uuid4())[:12]
            excel_upload = ExcelUpload.objects.create(
                file=file,
                camp=camp,
                package=package,
                unique_id=unique_excel_id
            )

            df = pd.read_excel(file)
            for _, row in df.iterrows():
                unique_patient_id = str(uuid.uuid4())[:8]
                PatientData.objects.create(
                    excel_upload=excel_upload,
                    patient_excel_id=row.get('PatientExcelID', ''),
                    unique_patient_id=unique_patient_id,
                    patient_name=row['PatientName'],
                    age=row['Age'],
                    gender=row['Gender'],
                    contact_number=row['Contact'],
                    service=row['Service']
                )

            return Response({'message': 'File uploaded and patients added successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
