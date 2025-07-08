from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from clients.models.camp import Camp
from clients.models.package import Package
from clients.models.service import Service
from technician.Models.technician import Technician
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment


@api_view(['POST'])
def assign_technicians(request):
    """
    Assign multiple technicians to services for a specific camp.
    Expected format:
    {
        "camp_id": 1,
        "assignments": [
            {
                "service_id": 2,
                "technician_ids": [1, 3]
            },
            {
                "service_id": 4,
                "technician_ids": [2]
            }
        ]
    }
    """
    camp_id = request.data.get('camp_id')
    assignments = request.data.get('assignments', [])

    try:
        camp = Camp.objects.get(id=camp_id)
    except Camp.DoesNotExist:
        return Response({"error": "Camp not found"}, status=404)

    for item in assignments:
        service_id = item.get('service_id')
        technician_ids = item.get('technician_ids', [])

        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            continue

        # Remove previous assignments for this camp/service
        TechnicianServiceAssignment.objects.filter(camp=camp, service=service).delete()

        # Create new assignments
        for tech_id in technician_ids:
            try:
                technician = Technician.objects.get(id=tech_id)
                TechnicianServiceAssignment.objects.create(
                    technician=technician,
                    service=service,
                    camp=camp
                )
            except Technician.DoesNotExist:
                continue

    return Response({"status": "success", "message": "Assignments saved successfully"})


@api_view(['POST'])
def assign_technicians_to_package(request):
    """
    Assign multiple technicians to multiple services within a specific camp and package.

    Expected request body:
    {
        "camp_id": 40,
        "package_id": 19,
        "service_id": 1,
        "technician_ids": [1, 2]
    }
    """

    camp_id = request.data.get('camp_id')
    package_id = request.data.get('package_id')
    service_id = request.data.get('service_id')
    technician_ids = request.data.get('technician_ids', [])

    # Validate required fields
    if not (camp_id and package_id and service_id and technician_ids):
        return Response({"error": "Missing required fields."}, status=status.HTTP_400_BAD_REQUEST)

    try:
        camp = Camp.objects.get(id=camp_id)
        package = Package.objects.get(id=package_id)
        service = Service.objects.get(id=service_id)
    except Camp.DoesNotExist:
        return Response({"error": "Camp not found."}, status=404)
    except Package.DoesNotExist:
        return Response({"error": "Package not found."}, status=404)
    except Service.DoesNotExist:
        return Response({"error": "Service not found."}, status=404)

    # Optionally: delete existing assignments for this package+service
    TechnicianServiceAssignment.objects.filter(
        camp=camp,
        package=package,
        service=service
    ).delete()

    assigned_techs = []

    for tech_id in technician_ids:
        try:
            technician = Technician.objects.get(id=tech_id)
            TechnicianServiceAssignment.objects.create(
                technician=technician,
                service=service,
                camp=camp,
                package=package
            )
            assigned_techs.append({"id": technician.id, "name": technician.name})
        except Technician.DoesNotExist:
            continue

    return Response({
        "message": "Technicians assigned to service successfully.",
        "camp_id": camp.id,
        "package_id": package.id,
        "service_id": service.id,
        "assigned_technicians": assigned_techs
    }, status=200)