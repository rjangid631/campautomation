from rest_framework.decorators import api_view
from rest_framework.response import Response
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment

from rest_framework.decorators import api_view
from rest_framework.response import Response
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment

@api_view(['GET'])
def get_technician_assignments(request):
    technician_id = request.query_params.get('technician_id')
    if not technician_id:
        return Response({"error": "technician_id is required"}, status=400)

    # Get all assignments for the technician
    assignments = TechnicianServiceAssignment.objects.filter(technician_id=technician_id)

    response_data = []

    for assignment in assignments:
        response_data.append({
            "camp_id": assignment.camp.id,
            "camp_location": assignment.camp.location,
            "service_id": assignment.service.id,
            "service_name": assignment.service.name,
        })

    return Response({"assignments": response_data})
