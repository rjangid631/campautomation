from camp_manager.Models.Patientdata import PatientData
from technician.Models.smartreport import SmartReport
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

class UploadSmartReportPDF(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        print("✅ Received POST request to /smart-report-upload/")
        
        # ✅ Fix: Extract patient_id from form data
        patient_id = request.data.get("patient_id")
        file = request.FILES.get("report_pdf")

        if not file or not patient_id:
            return Response({"error": "Missing fields"}, status=400)

        # ✅ Fix: use correct field name
        patient = PatientData.objects.filter(unique_patient_id=patient_id).first()
        if not patient:
            return Response({"error": "Invalid patient"}, status=404)

        smart_report, created = SmartReport.objects.get_or_create(patient=patient)
        smart_report.final_pdf = file
        smart_report.save()

        return Response({"message": "Uploaded successfully"}, status=200)
