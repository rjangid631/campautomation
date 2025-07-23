# technician/views.py
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from camp_manager.Models.Patientdata import PatientData
from technician.Models.audiometry import Audiometry
from django.core.files.base import ContentFile
import logging

logger = logging.getLogger(__name__)  # ✅ Logger initialized

class UploadFrontendGeneratedPDFView(APIView):
    parser_classes = [MultiPartParser]

    def post(self, request):
        logger.info("Received request to upload frontend-generated PDF.")

        patient_unique_id = request.data.get('patient_unique_id')
        pdf_file = request.FILES.get('pdf')

        logger.debug(f"patient_unique_id: {patient_unique_id}")
        logger.debug(f"PDF file received: {pdf_file.name if pdf_file else 'No file'}")

        if not patient_unique_id or not pdf_file:
            logger.warning("Missing patient ID or PDF file.")
            return Response({'error': 'Missing patient ID or PDF file'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            patient = PatientData.objects.get(unique_patient_id=patient_unique_id)
            logger.info(f"Patient found: {patient.patient_name}")
        except PatientData.DoesNotExist:
            logger.error(f"Invalid patient_unique_id: {patient_unique_id}")
            return Response({'error': 'Invalid patient_unique_id'}, status=status.HTTP_404_NOT_FOUND)

        try:
            audiometry = Audiometry.objects.get(patient=patient)
            logger.info(f"Audiometry record found for patient {patient_unique_id}")
        except Audiometry.DoesNotExist:
            logger.error(f"Audiometry record not found for patient {patient_unique_id}")
            return Response({'error': 'Audiometry record not found for patient'}, status=status.HTTP_404_NOT_FOUND)

        # Save PDF
        audiometry.pdf_report.save(pdf_file.name, pdf_file, save=True)
        logger.info(f"PDF saved to audiometry record for patient {patient_unique_id} as {pdf_file.name}")

        return Response({'message': 'PDF uploaded and saved successfully'}, status=status.HTTP_200_OK)
