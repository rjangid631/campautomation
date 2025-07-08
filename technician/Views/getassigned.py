from rest_framework.decorators import api_view
from rest_framework.response import Response
from technician.Models.technician import Technician
from camp_manager.Models.Patientdata import PatientData

@api_view(['GET', 'POST'])
def get_assigned_patients(request):
    # Get technician and package IDs from request
    technician_id = (
        request.data.get("technician_id") if request.method == "POST"
        else request.query_params.get("technician_id")
    )

    package_id = (
        request.data.get("package_id") if request.method == "POST"
        else request.query_params.get("package_id")
    )

    # Validate technician ID
    if not technician_id:
        return Response({"error": "Technician ID is required"}, status=400)

    try:
        technician = Technician.objects.get(id=technician_id)
    except Technician.DoesNotExist:
        return Response({"error": "Technician not found"}, status=404)

    # Get list of technician services
    technician_services = [s.lower().strip() for s in technician.services.values_list('name', flat=True)]

    # Base queryset
    matching_patients = PatientData.objects.filter(checked_in=True)

    # Filter by package through excel_upload
    if package_id:
        matching_patients = matching_patients.filter(excel_upload__package_id=package_id)

    # Filter patients by matching technician services
    filtered_patients = [
        patient for patient in matching_patients
        if any(service.strip().lower() in technician_services for service in patient.service.split(','))
    ]

    # Prepare response data
    data = [
        {
            "id": patient.id,
            "name": patient.patient_name,
            "unique_patient_id": patient.unique_patient_id,
            "services": patient.service,
        }
        for patient in filtered_patients
    ]

    return Response({
        "status": "success",
        "patients": data
    })
