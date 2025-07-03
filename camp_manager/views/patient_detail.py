# camp_manager/views/patient_detail.py

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from camp_manager.Models.Patientdata import PatientData
from camp_manager.Serializers.patientdataserializer import PatientDataSerializer

# GET: Patient Details by QR
@api_view(['GET'])
def get_patient_details(request, unique_patient_id):
    try:
        patient = PatientData.objects.get(unique_patient_id=unique_patient_id)
        serializer = PatientDataSerializer(patient, context={'request': request})
        return Response(serializer.data)
    except PatientData.DoesNotExist:
        return Response({"error": "Patient not found"}, status=404)

# POST: Check-In by QR
@api_view(['GET', 'POST'])  # Allow GET for QR scanner flow
def check_in_patient(request, unique_patient_id):
    patient = get_object_or_404(PatientData, unique_patient_id=unique_patient_id)

    if patient.checked_in:
        # Still return the PDF slip
        if patient.pdf_slip:
            return FileResponse(patient.pdf_slip.open(), content_type='application/pdf')
        return Response({"message": "Patient already checked in, but no PDF available."})

    # ✅ Mark as checked in
    patient.checked_in = True
    patient.save()

    if patient.pdf_slip:
        return FileResponse(patient.pdf_slip.open(), content_type='application/pdf')
    else:
        return Response({"message": "Patient checked in, but PDF not found."}, status=200)