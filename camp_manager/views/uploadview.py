from rest_framework.parsers import MultiPartParser
from rest_framework import viewsets, status
from rest_framework.response import Response
import pandas as pd
import uuid
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from reportlab.pdfgen import canvas

from clients.models.camp import Camp
from clients.models.package import Package
from camp_manager.Models.Upload_excel import ExcelUpload
from camp_manager.Models.Patientdata import PatientData
from camp_manager.Serializers.exceluploadserializer import ExcelUploadSerializer

class UploadExcelViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser]

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

            required_columns = ['patient_name', 'age', 'gender', 'phone']
            missing_columns = [col for col in required_columns if col not in df.columns]
            if missing_columns:
                return Response({'error': f'Missing columns in Excel: {missing_columns}'}, status=400)

            main_services = [
                'X-ray', 'ECG', 'PFT', 'Audiometry', 'Optometry',
                'Doctor Consultation', 'Pathology', 'Dental Consultation',
                'Vitals', 'Form 7', 'BMD', 'Tetanus Vaccine',
                'Typhoid Vaccine', 'Coordinator'
            ]
            pathology_subservices = [
                'CBC', 'Complete Hemogram', 'Hemoglobin', 'Urine Routine',
                'Stool Examination', 'Lipid Profile', 'Kidney Profile',
                'LFT', 'KFT', 'Random Blood Glucose', 'Blood Grouping'
            ]

            for _, row in df.iterrows():
                unique_patient_id = str(uuid.uuid4())[:8]

                services_done = [
                    service for service in main_services
                    if service in df.columns and str(row.get(service, '')).strip().lower() in ['yes', 'done', '1', 'true']
                ]

                pathology_done = [
                    sub for sub in pathology_subservices
                    if sub in df.columns and str(row.get(sub, '')).strip().lower() in ['yes', 'done', '1', 'true']
                ]

                all_services = services_done + pathology_done

                # ✅ Full QR Code Data
                qr_data = f"http://192.168.1.13:8000/api/campmanager/patient/{unique_patient_id}/checkin/"

                qr = qrcode.make(qr_data)
                buffer = BytesIO()
                qr.save(buffer, format='PNG')
                filename = f'{unique_patient_id}_qr.png'

                # ✅ Create patient and save QR
                patient = PatientData.objects.create(
                    excel_upload=excel_upload,
                    patient_excel_id=row.get('patient_id', ''),
                    unique_patient_id=unique_patient_id,
                    patient_name=row.get('patient_name', ''),
                    age=row.get('age', 0),
                    gender=row.get('gender', ''),
                    contact_number=row.get('phone', ''),
                    service=", ".join(all_services)
                )
                patient.qr_code.save(filename, ContentFile(buffer.getvalue()), save=True)

                # 🖨 PDF Slip generation
                pdf_buffer = BytesIO()
                c = canvas.Canvas(pdf_buffer)
                c.setFont("Helvetica", 12)

                c.drawString(100, 800, "🩺 Camp Medical Slip")
                c.drawString(100, 780, f"Name: {patient.patient_name}")
                c.drawString(100, 760, f"Age: {patient.age}")
                c.drawString(100, 740, f"Gender: {patient.gender}")
                c.drawString(100, 720, f"Contact: {patient.contact_number}")
                c.drawString(100, 700, f"Package: {package.name if package else '-'}")
                c.drawString(100, 680, f"Services: {', '.join(all_services)}")

                # Add QR image to PDF
                qr_buffer = buffer.getvalue()
                qr_img_path = f"{unique_patient_id}_qr.png"
                with open(qr_img_path, "wb") as f:
                    f.write(qr_buffer)
                c.drawImage(qr_img_path, 400, 730, width=100, height=100)

                c.save()
                pdf_buffer.seek(0)

                # Save PDF to model
                pdf_filename = f"{unique_patient_id}_slip.pdf"
                patient.pdf_slip.save(pdf_filename, ContentFile(pdf_buffer.read()), save=True)

            return Response({'message': 'File uploaded and patients with QR and PDF slips created successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=500)
