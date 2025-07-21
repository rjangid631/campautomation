from rest_framework.decorators import api_view
from rest_framework.response import Response
from camp_manager.Models.Patientdata import PatientData
from clients.models.service import Service
from technician.Models.servicestatus import ServiceStatus, ServiceLog
from technician.Models.technician import Technician
from clients.models.package import Package
from clients.models.camp import Camp
from django.db.models import Count, Q


@api_view(['POST'])
def mark_service_done(request):
    technician_id = request.data.get('technician_id')
    patient_identifier = request.data.get('patient_id')
    service_id = request.data.get('service_id')

    try:
        technician = Technician.objects.get(id=technician_id)
        patient = PatientData.objects.get(unique_patient_id=patient_identifier)
        service = Service.objects.get(id=service_id)
    except Technician.DoesNotExist:
        return Response({"status": "error", "message": "Technician not found"}, status=400)
    except PatientData.DoesNotExist:
        return Response({"status": "error", "message": "Patient not found"}, status=400)
    except Service.DoesNotExist:
        return Response({"status": "error", "message": "Service not found"}, status=400)

    service_status, created = ServiceStatus.objects.get_or_create(
        patient=patient,
        service=service,
        defaults={'technician': technician, 'is_completed': True}
    )

    if not created and service_status.is_completed:
        return Response({
            "status": "info",
            "message": f"Service '{service.name}' already completed for patient '{patient.patient_name}'"
        })

    service_status.is_completed = True
    service_status.technician = technician
    service_status.save()

    ServiceLog.objects.create(service_status=service_status, technician=technician)

    package = getattr(patient, 'package', None)
    if package:
        total_services = ServiceStatus.objects.filter(patient=patient).count()
        completed_services = ServiceStatus.objects.filter(patient=patient, is_completed=True).count()

        if total_services > 0 and total_services == completed_services:
            package.is_completed = True
            package.save()

            camp = package.camp
            if camp:
                all_completed = not camp.packages.filter(is_completed=False).exists()
                if all_completed:
                    camp.is_completed = True
                    camp.save()

    return Response({
        "status": "success",
        "message": f"Service '{service.name}' marked as completed for patient '{patient.patient_name}'"
    })


@api_view(['GET'])
def get_camp_progress(request, camp_id):
    try:
        camp = Camp.objects.get(id=camp_id)
    except Camp.DoesNotExist:
        return Response({"status": "error", "message": "Camp not found"}, status=404)

    packages = camp.packages.all()
    services = Service.objects.filter(packages__in=packages).distinct()
    service_statuses = ServiceStatus.objects.filter(service__in=services)

    total_services = service_statuses.count()
    completed_services = service_statuses.filter(is_completed=True).count()
    pending_services = total_services - completed_services

    progress_percent = round((completed_services / total_services) * 100, 2) if total_services > 0 else 0

    # Mark camp complete if needed
    if total_services > 0 and completed_services == total_services:
        if not camp.is_completed:
            camp.is_completed = True
            camp.save()

    # Mark each package complete if all its services are done
    for pkg in packages:
        pkg_services = ServiceStatus.objects.filter(service__in=pkg.services.all())
        if pkg_services.exists() and not pkg_services.filter(is_completed=False).exists():
            if not pkg.is_completed:
                pkg.is_completed = True
                pkg.save()

    # Per technician summary
    technician_summary = (
        service_statuses
        .filter(technician__isnull=False)
        .values('technician__user__name')
        .annotate(total=Count('id'), completed=Count('id', filter=Q(is_completed=True)))
    )

    # Per service summary
    service_summary = (
        service_statuses
        .values('service__name')
        .annotate(total=Count('id'), completed=Count('id', filter=Q(is_completed=True)))
    )

    return Response({
        "camp_id": camp.id,
        "camp_name": str(camp),
        "total_services": total_services,
        "completed_services": completed_services,
        "pending_services": pending_services,
        "progress_percent": progress_percent,
        "is_completed": camp.is_completed,
        "technician_summary": list(technician_summary),
        "service_summary": list(service_summary)
    })


@api_view(['GET'])
def get_patient_service_summary(request, patient_id):
    try:
        patient = PatientData.objects.get(unique_patient_id=patient_id)
    except PatientData.DoesNotExist:
        return Response({"status": "error", "message": "Patient not found"}, status=404)

    total_services = ServiceStatus.objects.filter(patient=patient).count()
    completed_services = ServiceStatus.objects.filter(patient=patient, is_completed=True).count()

    return Response({
        "patient_id": patient.unique_patient_id,
        "patient_name": patient.patient_name,
        "total_services": total_services,
        "completed_services": completed_services,
        "pending_services": total_services - completed_services
    })
