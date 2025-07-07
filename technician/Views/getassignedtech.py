from rest_framework.decorators import api_view
from rest_framework.response import Response
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment

@api_view(['GET'])
def get_technician_assignments(request):
    camp_id = request.query_params.get('camp_id')
    if not camp_id:
        return Response({"error": "camp_id is required"}, status=400)

    assignments = TechnicianServiceAssignment.objects.filter(camp_id=camp_id)

    response_data = {}
    for assignment in assignments:
        service_id = assignment.service.id
        technician_id = assignment.technician.id

        if service_id not in response_data:
            response_data[service_id] = []
        response_data[service_id].append(technician_id)

    return Response(response_data)
