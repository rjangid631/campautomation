from rest_framework.decorators import api_view
from rest_framework.response import Response

from camp_manager.Models.Patientdata import PatientData
from clients.models.service import Service
from technician.Models.servicestatus import ServiceStatus
from technician.Models.technician import Technician
from technician.serializers.servicestatus import ServiceStatusSerializer

@api_view(['POST'])
def mark_service_done(request):
    technician_id = request.data.get('technician_id')
    patient_id = request.data.get('patient_id')
    service_id = request.data.get('service_id')

    try:
        technician = Technician.objects.get(id=technician_id)
        patient = PatientData.objects.get(id=patient_id)
        service = Service.objects.get(id=service_id)
    except (Technician.DoesNotExist, PatientData.DoesNotExist, Service.DoesNotExist):
        return Response({"status": "error", "message": "Invalid data provided"}, status=400)

    service_status, created = ServiceStatus.objects.get_or_create(
        patient=patient, service=service, technician=technician
    )
    service_status.is_completed = True
    service_status.save()

    serializer = ServiceStatusSerializer(service_status)
    return Response({"status": "success", "data": serializer.data})