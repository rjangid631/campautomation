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


@api_view(['POST', 'GET'])
def assign_technicians_to_package(request):
    camp_id     = request.data.get('camp_id')
    package_id  = request.data.get('package_id')
    assignments = request.data.get('assignments', [])

    if not (camp_id and package_id and assignments):
        return Response({"error": "Missing required fields."}, status=400)

    try:
        camp    = Camp.objects.get(id=camp_id)
        package = Package.objects.get(id=package_id)
    except Camp.DoesNotExist:
        return Response({"error": "Camp not found."}, status=404)
    except Package.DoesNotExist:
        return Response({"error": "Package not found."}, status=404)

    response_data = []

    for assign in assignments:
        tech_id     = assign.get("technician_id")
        service_ids = assign.get("service_ids", [])

        try:
            technician = Technician.objects.get(id=tech_id)
        except Technician.DoesNotExist:
            continue

        # 1️⃣  DELETE only this technician's rows for this camp+package
        TechnicianServiceAssignment.objects.filter(
            technician=technician,
            camp=camp,
            package=package
        ).delete()

        # 2️⃣  CREATE new rows
        for sid in service_ids:
            try:
                service = Service.objects.get(id=sid)
                TechnicianServiceAssignment.objects.create(
                    technician=technician,
                    service=service,
                    camp=camp,
                    package=package
                )
            except Service.DoesNotExist:
                continue

        response_data.append({
            "technician_id":   technician.id,
            "technician_name": technician.user.name if technician.user else f"Technician #{technician.id}",
            "services":        service_ids
        })

    return Response({
        "message": "Services assigned to technicians successfully.",
        "camp_id": camp.id,
        "package_id": package.id,
        "assigned_services": response_data
    })