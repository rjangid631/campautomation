from django.urls import include, path
from technician.Views.audiometryviewset import AudiometryViewSet
from technician.Views.getassignedtech import get_technician_assignments
from technician.Views.technicains import get_all_technicians
from technician.Views.technicianlogin import technician_login
from technician.Views.getassigned import get_assigned_patients
from technician.Views.mark_service import mark_service_done
from technician.Views.assigntechnician import assign_technicians, assign_technicians_to_package
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'audiometry', AudiometryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', technician_login, name='technician_login'),
    path('patients/', get_assigned_patients, name='get_assigned_patients'),
    path('submit/', mark_service_done, name='mark_service_done'),
    path('assign/', assign_technicians, name='assign_technicians'),
    path('assignments/', get_technician_assignments, name='get_technician_assignments'),
    path('technicians/', get_all_technicians, name='get_all_technicians'),
    path('assign-package/', assign_technicians_to_package, name='assign_technicians_to_package'),  # ✅ Add this
]
