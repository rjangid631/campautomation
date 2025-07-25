from rest_framework.decorators import api_view
from rest_framework.response import Response
from camp_manager.Models.Patientdata import PatientData
from clients.models.service import Service
from technician.Models.servicestatus import ServiceStatus, ServiceLog
from technician.Models.technician import Technician
from clients.models.package import Package
from clients.models.camp import Camp
from django.db.models import Count, Q, F


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

    # ✅ Per technician with assigned service summary
    technician_summary_raw = (
        service_statuses
        .filter(technician__isnull=False)
        .values('technician__user__name', 'service__name')
        .annotate(
            total=Count('id'),
            completed=Count('id', filter=Q(is_completed=True))
        )
    )

    technician_summary = {}
    for item in technician_summary_raw:
        tech_name = item['technician__user__name']
        service_name = item['service__name']

        if tech_name not in technician_summary:
            technician_summary[tech_name] = {
                "technician": tech_name,
                "services": []
            }

        technician_summary[tech_name]["services"].append({
            "service_name": service_name,
            "total": item["total"],
            "completed": item["completed"]
        })

    technician_summary = list(technician_summary.values())

    # ✅ Per service summary
    service_summary = (
        service_statuses
        .values('service__name')
        .annotate(total=Count('id'), completed=Count('id', filter=Q(is_completed=True)))
    )

    # ✅ Per patient progress
    patient_progress = (
        service_statuses
        .values('patient__id', 'patient__patient_name')
        .annotate(
            total=Count('id'),
            completed=Count('id', filter=Q(is_completed=True)),
        )
    )

    for p in patient_progress:
        p['pending'] = p['total'] - p['completed']
        p['progress_percent'] = round((p['completed'] / p['total']) * 100, 2) if p['total'] > 0 else 0

    # ✅ Total and Completed patients
    total_patients = PatientData.objects.filter(service_statuses__in=service_statuses).distinct().count()

    completed_patients = (
        PatientData.objects
        .filter(service_statuses__in=service_statuses)
        .annotate(
            total=Count('service_statuses'),
            completed=Count('service_statuses', filter=Q(service_statuses__is_completed=True))
        )
        .filter(total=F('completed'))
        .distinct()
        .count()
    )

    return Response({
        "camp_id": camp.id,
        "camp_name": str(camp),
        "total_services": total_services,
        "completed_services": completed_services,
        "pending_services": pending_services,
        "progress_percent": progress_percent,
        "is_completed": camp.is_completed,
        "technician_summary": technician_summary,
        "service_summary": list(service_summary),
        "patient_progress": list(patient_progress),
        "total_patients": total_patients,
        "completed_patients": completed_patients
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
