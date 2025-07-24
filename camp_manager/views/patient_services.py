# camp_manager/views/patient_services.py

from rest_framework.decorators import api_view
from rest_framework.response import Response
from camp_manager.Models.Patientdata import PatientData
from camp_manager.Models.Upload_excel import ExcelUpload
from clients.models.camp import Camp
from technician.Models.servicestatus import ServiceStatus

@api_view(['GET'])
def get_patients_with_services(request, camp_id):
    try:
        camp = Camp.objects.get(id=camp_id)
    except Camp.DoesNotExist:
        return Response({"status": "error", "message": "Camp not found"}, status=404)

    excel_uploads = ExcelUpload.objects.filter(camp=camp)
    patients = PatientData.objects.filter(excel_upload__in=excel_uploads)

    data = []

    for patient in patients:
        service_statuses = ServiceStatus.objects.filter(patient=patient).select_related('service', 'technician__user')
        
        services = []
        for status in service_statuses:
            services.append({
                "service_name": status.service.name,
                "is_completed": status.is_completed,
                "technician_name": status.technician.user.name if status.technician and status.technician.user else None,
                "last_updated": status.updated_at.strftime("%Y-%m-%d %H:%M:%S")
            })

        data.append({
            "unique_patient_id": patient.unique_patient_id,
            "name": patient.patient_name,
            "age": patient.age,
            "gender": patient.gender,
            "contact_number": patient.contact_number,
            "package": patient.package.name if patient.package else None,
            "checked_in": patient.checked_in,
            "services": services
        })

    return Response({
        "status": "success",
        "camp_id": camp_id,
        "total_patients": patients.count(),
        "patients": data
    })
