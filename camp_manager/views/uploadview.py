from rest_framework.parsers import MultiPartParser
from rest_framework import viewsets, status
from rest_framework.response import Response
import pandas as pd
import uuid
import qrcode
from io import BytesIO
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont, ImageWin
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
import tempfile
import os
import traceback
import win32print
import win32ui
from rest_framework.decorators import api_view
from django.http import HttpResponse, FileResponse
from django.shortcuts import get_object_or_404

from clients.models.camp import Camp
from clients.models.package import Package
from clients.models.service import Service
from camp_manager.Models.Upload_excel import ExcelUpload
from camp_manager.Models.Patientdata import PatientData
from technician.Models.servicestatus import ServiceStatus
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from camp_manager.Serializers.exceluploadserializer import ExcelUploadSerializer

class UploadExcelViewSet(viewsets.ViewSet):
    parser_classes = [MultiPartParser]
    ENABLE_THERMAL_PRINTING = False

    def get_thermal_printer_name(self):
        try:
            printers = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)
            for flags, description, name, comment in printers:
                if any(x in name.lower() for x in ["pos", "thermal", "80"]):
                    return name
            return win32print.GetDefaultPrinter()
        except Exception:
            return win32print.GetDefaultPrinter()

    def print_thermal_slip(self, slip_path, patient_name):
        if not self.ENABLE_THERMAL_PRINTING:
            return
        try:
            printer_name = self.get_thermal_printer_name()
            hprinter = win32print.OpenPrinter(printer_name)
            hdc = win32ui.CreateDC()
            hdc.CreatePrinterDC(printer_name)
            hdc.StartDoc("Camp Medical Slip")
            hdc.StartPage()

            bmp = Image.open(slip_path).convert("RGB")
            dib = ImageWin.Dib(bmp)
            printable_width = hdc.GetDeviceCaps(8)
            aspect_ratio = bmp.height / bmp.width
            scaled_height = int(printable_width * aspect_ratio)
            dib.draw(hdc.GetHandleOutput(), (0, 0, printable_width, scaled_height))

            hdc.EndPage()
            hdc.EndDoc()
            hdc.DeleteDC()
            win32print.ClosePrinter(hprinter)

        except Exception:
            traceback.print_exc()

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
            excel_upload = ExcelUpload.objects.create(file=file, camp=camp, package=package, unique_id=unique_excel_id)

            df = pd.read_excel(file)
            required_columns = ['patient_name', 'age', 'gender', 'phone']
            missing = [col for col in required_columns if col not in df.columns]
            if missing:
                return Response({'error': f'Missing columns in Excel: {missing}'}, status=400)

            known_cols = ['patient_id'] + required_columns
            service_columns = [col for col in df.columns if col not in known_cols]

            created_patients_data = []

            for _, row in df.iterrows():
                unique_patient_id = str(uuid.uuid4())[:8]

                selected_services = [
                    svc for svc in service_columns
                    if str(row.get(svc)).strip().lower() in ['yes', '1', 'true', 'done']
                ]

                qr_data = f"http://192.168.1.21:8000/api/campmanager/patient/{unique_patient_id}/checkin/"
                qr_img = qrcode.make(qr_data)
                qr_buffer = BytesIO()
                qr_img.save(qr_buffer, format='PNG')
                qr_filename = f'{unique_patient_id}_qr.png'

                patient = PatientData.objects.create(
                    excel_upload=excel_upload,
                    patient_excel_id=row.get('patient_id', ''),
                    unique_patient_id=unique_patient_id,
                    patient_name=row.get('patient_name', ''),
                    age=row.get('age', 0),
                    gender=row.get('gender', ''),
                    contact_number=row.get('phone', ''),
                    service=", ".join(selected_services)
                )
                patient.qr_code.save(qr_filename, ContentFile(qr_buffer.getvalue()), save=True)

                for service_name in selected_services:
                    try:
                        service_obj = Service.objects.get(name__iexact=service_name.strip())
                        assignment = TechnicianServiceAssignment.objects.filter(
                            camp=camp,
                            service=service_obj,
                            technician__in=package.technicians.all()
                        ).first()

                        ServiceStatus.objects.create(
                            patient=patient,
                            service=service_obj,
                            technician=assignment.technician if assignment else None,
                            is_completed=False
                        )
                    except Service.DoesNotExist:
                        continue

                # Generate PDF
                pdf_buffer = BytesIO()
                c = canvas.Canvas(pdf_buffer, pagesize=A4)
                c.setFont("Helvetica-Bold", 14)
                c.drawString(50, 800, "🦠 Camp Medical Slip")
                c.setFont("Helvetica", 12)
                c.drawString(50, 770, f"Name: {patient.patient_name}")
                c.drawString(50, 750, f"Age: {patient.age}")
                c.drawString(50, 730, f"Gender: {patient.gender}")
                c.drawString(50, 710, f"Contact: {patient.contact_number}")
                c.drawString(50, 690, f"Package: {package.name}")
                c.drawString(50, 670, "Selected Services:")
                y = 650
                for s in selected_services:
                    c.drawString(70, y, f"\u2022 {s}")
                    y -= 20
                qr_buffer.seek(0)
                c.drawImage(ImageReader(qr_buffer), 400, 700, width=120, height=120)
                c.save()
                pdf_buffer.seek(0)

                pdf_filename = f"{unique_patient_id}_slip.pdf"
                patient.pdf_slip.save(pdf_filename, ContentFile(pdf_buffer.read()), save=True)

                created_patients_data.append({
                    "id": patient.id,
                    "name": patient.patient_name,
                    "unique_patient_id": patient.unique_patient_id,
                    "services": selected_services
                })

            return Response({
                'message': 'Excel uploaded. Patients created successfully.',
                'patients': created_patients_data
            })

        except Exception as e:
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)



@api_view(['POST'])
def print_thermal_slips(request):
    patient_ids = request.data.get('patient_ids', [])
    if not patient_ids:
        return Response({'error': 'patient_ids list is required'}, status=400)

    printer = UploadExcelViewSet()
    printer.ENABLE_THERMAL_PRINTING = True

    printed, failed = [], []

    for pid in patient_ids:
        try:
            patient = PatientData.objects.get(id=pid)
            slip_path = os.path.join(tempfile.gettempdir(), f"{patient.unique_patient_id}_thermal.png")
            if os.path.exists(slip_path):
                printer.print_thermal_slip(slip_path, patient.patient_name)
                printed.append(patient.id)
            else:
                failed.append(patient.id)
        except:
            failed.append(pid)

    return Response({
        "message": "Thermal printing complete.",
        "printed": printed,
        "failed": failed
    })
