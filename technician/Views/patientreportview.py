from rest_framework.views import APIView
from rest_framework.response import Response
from technician.Models.audiometry import  Audiometry
from technician.Models.dentalconsultation import DentalConsultation
from technician.Models.doctorconsultation import DoctorConsultation
from technician.Models.optometry import Optometry
from technician.Models.vitals import Vitals


class PatientReportLinksView(APIView):
    def get(self, request):
        reports = []

        # Dental
        for obj in DentalConsultation.objects.select_related('patient'):
            if obj.pdf_report:
                reports.append({
                    "patient_name": obj.patient.patient_name,
                    "report_type": "Dental",
                    "pdf_link": request.build_absolute_uri(obj.pdf_report.url),
                })

        # Audiometry
        for obj in Audiometry.objects.select_related('patient'):
            if obj.pdf_report:
                reports.append({
                    "patient_name": obj.patient.patient_name,
                    "report_type": "Audiometry",
                    "pdf_link": request.build_absolute_uri(obj.pdf_report.url),
                })

        # Doctor
        for obj in DoctorConsultation.objects.select_related('patient'):
            if obj.pdf_report:
                reports.append({
                    "patient_name": obj.patient.patient_name,
                    "report_type": "Doctor",
                    "pdf_link": request.build_absolute_uri(obj.pdf_report.url),
                })

        # Optometry
        for obj in Optometry.objects.select_related('patient'):
            if obj.pdf_report:
                reports.append({
                    "patient_name": obj.patient.patient_name,
                    "report_type": "Optometry",
                    "pdf_link": request.build_absolute_uri(obj.pdf_report.url),
                })

        # Vitals
        for obj in Vitals.objects.select_related('patient'):
            if obj.pdf_report:
                reports.append({
                    "patient_name": obj.patient.patient_name,
                    "report_type": "Vitals",
                    "pdf_link": request.build_absolute_uri(obj.pdf_report.url),
                })

        return Response(reports)
