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
    POST Body:
    {
        "package_id": 1,
        "technician_ids": [2, 3, 4]
    }
    """
    package_id = request.data.get('package_id')
    technician_ids = request.data.get('technician_ids', [])

    try:
        package = Package.objects.get(id=package_id)
    except Package.DoesNotExist:
        return Response({"error": "Package not found."}, status=status.HTTP_404_NOT_FOUND)

    technicians = Technician.objects.filter(id__in=technician_ids)

    package.technicians.set(technicians)
    return Response({
        "message": "Technicians assigned successfully.",
        "package_id": package.id,
        "assigned_technicians": [{"id": t.id, "name": t.name} for t in technicians]
    }, status=status.HTTP_200_OK)
