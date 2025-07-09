from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from camp_manager.views import CampManagerViewSet
from camp_manager.views.camp_manager import CampManagerUserViewSet
from camp_manager.views.campmanager_auth import CampManagerLoginView, CampManagerRegisterView
from camp_manager.views.patient_detail import check_in_patient, get_patient_details
from camp_manager.views.uploadview import UploadExcelViewSet, get_patients_by_camp_and_package, print_thermal_slips

# For manual route
upload_excel_view = UploadExcelViewSet.as_view({'post': 'upload_excel'})

router = DefaultRouter()
router.register(r'users', CampManagerUserViewSet, basename='campmanager-user')
router.register(r'camps', CampManagerViewSet, basename='camp-manager')
# ❌ REMOVED:
# router.register(r'upload-excel', UploadExcelViewSet, basename='upload-excel')

urlpatterns = [
    path('', include(router.urls)),
    path('upload-excel/', upload_excel_view, name='upload-excel'),  # ✅ manual custom endpoint
    path('patient/<str:unique_patient_id>/', get_patient_details, name='get-patient-details'),
    path('patient/<str:unique_patient_id>/checkin/', check_in_patient, name='checkin-patient'),
    path('login/', CampManagerLoginView.as_view(), name='campmanager-login'),
    path('register/', CampManagerRegisterView.as_view(), name='campmanager-register'),
    path('print-thermal-slips/', print_thermal_slips, name='print-thermal-slips'),
    path('patients/', get_patients_by_camp_and_package, name='get-patients-by-camp-package'),
]

# ✅ Append static media files URL
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
