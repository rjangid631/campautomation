# camp_manager/views/patient_detail.py

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from camp_manager.Models.Patientdata import PatientData
from camp_manager.Serializers.patientdataserializer import PatientDataSerializer
import inspect
from camp_manager.Models.Patientdata import PatientData as CorrectPatientData

# GET: Patient Details by QR
@api_view(['GET'])
def get_patient_details(request, unique_patient_id):
    try:
        patient = PatientData.objects.get(unique_patient_id=unique_patient_id)
        serializer = PatientDataSerializer(patient, context={'request': request})
        return Response(serializer.data)
    except PatientData.DoesNotExist:
        return Response({"error": "Patient not found"}, status=404)

@api_view(['GET', 'POST'])
def check_in_patient(request, unique_patient_id):
    try:
        patient = PatientData.objects.get(unique_patient_id__iexact=unique_patient_id.strip())
    except PatientData.DoesNotExist:
        return Response({"detail": "No PatientData matches the given query."}, status=404)

    if not patient.checked_in:
        patient.checked_in = True
        patient.save()

    if patient.pdf_slip:
        return FileResponse(
            patient.pdf_slip.open(),
            content_type='application/pdf',
            as_attachment=True,
            filename=f"{patient.patient_name}_slip.pdf"
        )

    return Response({"message": "Patient checked in, but PDF not found."})