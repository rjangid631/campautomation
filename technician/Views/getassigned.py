# technician/Views/getassigned.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from technician.Models.technician import Technician
from camp_manager.Models.Patientdata import PatientData

@api_view(['POST'])
def get_assigned_patients(request):
    technician_id = request.data.get("technician_id", None)

    if not technician_id:
        return Response({"error": "Technician ID is required"}, status=400)

    try:
        technician = Technician.objects.get(id=technician_id)
    except Technician.DoesNotExist:
        return Response({"error": "Technician not found"}, status=404)

    # Get service names assigned to technician
    technician_services = technician.services.values_list('name', flat=True)

    # Filter PatientData by checked_in and matching service
    matching_patients = PatientData.objects.filter(
        checked_in=True
    )

    # Match any service in technician_services
    filtered_patients = [
        patient for patient in matching_patients
        if any(service.strip() in technician_services for service in patient.service.split(','))
    ]

    data = []
    for patient in filtered_patients:
        data.append({
            "id": patient.id,
            "name": patient.patient_name,
            "unique_patient_id": patient.unique_patient_id,
            "services": patient.service,
        })

    return Response({
        "status": "success",
        "patients": data
    })
