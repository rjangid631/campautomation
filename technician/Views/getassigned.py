from rest_framework.decorators import api_view
from rest_framework.response import Response
from technician.Models.technician import Technician
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from camp_manager.Models.Patientdata import PatientData
from clients.models.package import Package
from clients.models.camp import Camp

@api_view(['GET', 'POST'])
def get_assigned_patients(request):
    technician_id = (
        request.data.get("technician_id") if request.method == "POST"
        else request.query_params.get("technician_id")
    )
    package_id = (
        request.data.get("package_id") if request.method == "POST"
        else request.query_params.get("package_id")
    )
    camp_id = (
        request.data.get("camp_id") if request.method == "POST"
        else request.query_params.get("camp_id")
    )

    # Validate inputs
    if not technician_id or not package_id or not camp_id:
        return Response({"error": "technician_id, package_id, and camp_id are required."}, status=400)

    try:
        technician = Technician.objects.get(id=technician_id)
        package = Package.objects.get(id=package_id)
        camp = Camp.objects.get(id=camp_id)
    except Technician.DoesNotExist:
        return Response({"error": "Technician not found."}, status=404)
    except Package.DoesNotExist:
        return Response({"error": "Package not found."}, status=404)
    except Camp.DoesNotExist:
        return Response({"error": "Camp not found."}, status=404)

    # ✅ Get assigned services for technician in this camp and package
    assigned_services = TechnicianServiceAssignment.objects.filter(
        technician=technician,
        camp=camp,
        package=package
    ).values_list('service__name', flat=True)

    assigned_services = [s.strip().lower() for s in assigned_services]

    # ✅ Get matching patients
    matching_patients = PatientData.objects.filter(
        checked_in=True,
        excel_upload__package_id=package_id
    )

    filtered_patients = []
    for patient in matching_patients:
        all_services = [s.strip().lower() for s in patient.service.split(',')] if patient.service else []
        matched_services = [s for s in all_services if s in assigned_services]

        if matched_services:
            filtered_patients.append({
                "id": patient.id,
                "name": patient.patient_name,
                "unique_patient_id": patient.unique_patient_id,
                "services": ", ".join(matched_services),
            })

    return Response({
        "status": "success",
        "patients": filtered_patients
    })
