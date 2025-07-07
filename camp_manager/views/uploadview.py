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

    def get_thermal_printer_name(self):
        try:
            printers = win32print.EnumPrinters(win32print.PRINTER_ENUM_LOCAL | win32print.PRINTER_ENUM_CONNECTIONS)
            for flags, description, name, comment in printers:
                lower_name = name.lower()
                if "pos" in lower_name or "thermal" in lower_name or "80" in lower_name:
                    return name
            return win32print.GetDefaultPrinter()
        except Exception:
            return win32print.GetDefaultPrinter()

    def print_thermal_slip(self, slip_path, patient_name):
        try:
            printer_name = self.get_thermal_printer_name()
            print(f"🖨 Printing slip for: {patient_name} on printer: {printer_name}")

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
            print("🛑 Thermal Print Exception:")
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

            all_possible_services = [
                'X-ray', 'ECG', 'PFT', 'Audiometry', 'Optometry',
                'Doctor Consultation', 'Pathology', 'Dental Consultation',
                'Vitals', 'Form 7', 'BMD', 'Tetanus Vaccine',
                'Typhoid Vaccine', 'Coordinator', 'CBC', 'Complete Hemogram',
                'Hemoglobin', 'Urine Routine', 'Stool Examination', 'Lipid Profile',
                'Kidney Profile', 'LFT', 'KFT', 'Random Blood Glucose', 'Blood Grouping'
            ]

            for _, row in df.iterrows():
                unique_patient_id = str(uuid.uuid4())[:8]

                selected_services = [
                    service for service in all_possible_services
                    if service in df.columns and str(row.get(service, '')).strip().lower() in ['yes', 'done', '1', 'true']
                ]

                qr_data = f"http://192.168.1.13:8000/api/campmanager/patient/{unique_patient_id}/checkin/"
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

                # ✅ Create ServiceStatus entries for each selected service
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

                # ✅ PDF Generation
                pdf_buffer = BytesIO()
                c = canvas.Canvas(pdf_buffer, pagesize=A4)
                c.setFont("Helvetica-Bold", 14)
                c.drawString(50, 800, "🩺 Camp Medical Slip")
                c.setFont("Helvetica", 12)
                c.drawString(50, 770, f"Name: {patient.patient_name}")
                c.drawString(50, 750, f"Age: {patient.age}")
                c.drawString(50, 730, f"Gender: {patient.gender}")
                c.drawString(50, 710, f"Contact: {patient.contact_number}")
                c.drawString(50, 690, f"Package: {package.name if package else '-'}")
                c.drawString(50, 660, "Selected Services:")

                y_pos = 640
                for service in selected_services:
                    c.drawString(70, y_pos, f"• {service}")
                    y_pos -= 20

                qr_buffer.seek(0)
                c.drawImage(ImageReader(qr_buffer), 400, 700, width=120, height=120)
                c.save()

                pdf_buffer.seek(0)
                pdf_filename = f"{unique_patient_id}_slip.pdf"
                patient.pdf_slip.save(pdf_filename, ContentFile(pdf_buffer.read()), save=True)

                # ✅ Thermal Slip with Logo
                line_height = 30
                header_height = 300
                qr_height = 200
                logo_height = 100
                total_height = header_height + (len(selected_services) * line_height) + qr_height + logo_height

                width, height = 576, total_height
                slip = Image.new("L", (width, height), 255)
                draw = ImageDraw.Draw(slip)

                try:
                    font = ImageFont.truetype("arial.ttf", 24)
                except:
                    font = ImageFont.load_default()

                y = 10
                try:
                    logo = Image.open("media/logo.png").convert("L").resize((200, 80))
                    slip.paste(logo, (int((width - 200) / 2), y))
                    y += 90
                except Exception as e:
                    print("⚠️ Logo loading failed:", e)

                draw.text((10, y), "🩺 Camp Medical Slip", font=font, fill=0)
                y += 40
                draw.text((10, y), f"Name: {patient.patient_name}", font=font, fill=0)
                y += 30
                draw.text((10, y), f"Age: {patient.age}", font=font, fill=0)
                y += 30
                draw.text((10, y), f"Gender: {patient.gender}", font=font, fill=0)
                y += 30
                draw.text((10, y), f"Contact: {patient.contact_number}", font=font, fill=0)
                y += 30
                draw.text((10, y), f"Package: {package.name if package else '-'}", font=font, fill=0)
                y += 40

                draw.text((10, y), "Selected Services:", font=font, fill=0)
                y += 30
                for service in selected_services:
                    draw.text((30, y), f"✅ {service}", font=font, fill=0)
                    y += line_height

                qr_img = qrcode.make(qr_data).resize((180, 180))
                slip.paste(qr_img, (width - 200, y))

                slip_path = os.path.join(tempfile.gettempdir(), f"{unique_patient_id}_thermal.png")
                slip.save(slip_path)

                self.print_thermal_slip(slip_path, patient.patient_name)

            return Response({'message': 'PDF & Thermal slips created and printed successfully for all patients.'})
        except Exception as e:
            print("🛑 Upload Excel Exception:")
            traceback.print_exc()
            return Response({'error': str(e)}, status=500)
