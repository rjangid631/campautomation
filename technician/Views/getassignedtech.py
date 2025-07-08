from rest_framework.decorators import api_view
from rest_framework.response import Response
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment

from rest_framework.decorators import api_view
from rest_framework.response import Response
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment

@api_view(['GET'])
def get_technician_assignments(request):
    # Get the camp_id from query parameters
    camp_id = request.query_params.get('camp_id')
    if not camp_id:
        return Response({"error": "camp_id is required"}, status=400)

    # Fetch all technician-service assignments for the given camp
    assignments = TechnicianServiceAssignment.objects.filter(camp_id=camp_id)

    # Structure: { technician_id: [service_id1, service_id2, ...] }
    response_data = {}

    for assignment in assignments:
        technician_id = assignment.technician.id
        service_id = assignment.service.id

        # Group services under each technician
        if technician_id not in response_data:
            response_data[technician_id] = []
        response_data[technician_id].append(service_id)

    return Response(response_data)

