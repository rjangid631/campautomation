from django.urls import include, path
from rest_framework.routers import DefaultRouter

from technician.Views.audiometryviewset import AudiometryViewSet
from technician.Views.doctor_viewset import DoctorViewSet
from technician.Views.doctorconsultationviewset import DoctorConsultationViewSet
from technician.Views.optometristviewset import OptometristViewSet
from technician.Views.optometryviewset import OptometryViewSet  # ✅ Import new viewset
from technician.Views.getassignedtech import get_technician_assignments
from technician.Views.technicains import get_all_technicians
from technician.Views.technicianlogin import technician_login
from technician.Views.getassigned import get_assigned_patients
from technician.Views.mark_service import get_camp_progress, get_patient_service_summary, mark_service_done
from technician.Views.assigntechnician import assign_technicians, assign_technicians_to_package
from technician.Views.vitalsviewset import VitalsViewSet
from technician.Views.servicelogviewset import ServiceLogViewSet

router = DefaultRouter()
router.register(r'audiometry', AudiometryViewSet)
router.register(r'optometry', OptometryViewSet)  # ✅ Register Optometry
router.register(r'vitals', VitalsViewSet)  # ✅ Register VitalsViewSet
router.register(r'doctor-consultation', DoctorConsultationViewSet, basename='doctor-consultation') # ✅ Register DoctorConsultationViewSet
router.register(r'doctors', DoctorViewSet, basename='doctor') # ✅ Register DoctorViewSet
router.register(r'optometrists', OptometristViewSet) # ✅ Register OptometristViewSet
router.register(r'service-logs', ServiceLogViewSet, basename='service-log')


urlpatterns = [
    path('', include(router.urls)),
    path('login/', technician_login, name='technician_login'),
    path('patients/', get_assigned_patients, name='get_assigned_patients'),
    path('submit/', mark_service_done, name='mark_service_done'),
    path('assign/', assign_technicians, name='assign_technicians'),
    path('assignments/', get_technician_assignments, name='get_technician_assignments'),
    path('technicians/', get_all_technicians, name='get_all_technicians'),
    path('assign-package/', assign_technicians_to_package, name='assign_technicians_to_package'),
    path('camp/<int:camp_id>/progress/', get_camp_progress, name='get_camp_progress'),
    path('patient/<str:patient_id>/summary/', get_patient_service_summary, name='get_patient_service_summary'),

]
