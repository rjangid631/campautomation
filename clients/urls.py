from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from clients.views import ServicePriceView
from clients.views.CostDetailsview import CostDetailsViewSet
from clients.views.Costsummaryview import CostSummaryViewSet
from clients.views.ServiceCostView import ServiceCostViewSet, validate_coupon
from clients.views.Serviceselectionview import ServiceSelectionViewSet
from clients.views.Testcaseview import TestCaseDataViewSet
from clients.views.clientcampviewlist import ClientCampViewSet
from clients.views.clientdashboard import ClientDashboardView
from clients.views.clientview import ClientRegisterView
from clients.views.clientviewset import ClientViewSet
from clients.views.copypriceview import CopyPriceViewSet
from clients.views.packageview import PackageViewSet
from clients.views.pdfuploadview import PDFUploadView, generate_pdf_view
from clients.views.service_id_lookup import get_service_id_by_name
from clients.views.serviceviewset import ServiceViewSet
#from clients.views.token_view import CustomLoginView
from rest_framework_simplejwt.views import TokenRefreshView
from clients.views.ServicePriceView import ServicePriceView
from clients.views.loginview import ClientLoginView 


router = DefaultRouter()
router.register(r'camps', ClientCampViewSet, basename='camps')
router.register(r'serviceselection', ServiceSelectionViewSet, basename='service-selection')
router.register(r'test-case-data', TestCaseDataViewSet, basename='test-case-data')
router.register(r'cost_details', CostDetailsViewSet, basename='cost_details')
router.register(r'service_costs', ServiceCostViewSet)
router.register(r'costsummaries', CostSummaryViewSet)
router.register(r'copyprice', CopyPriceViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'packages', PackageViewSet)
router.register(r'clients', ClientViewSet, basename='clients')

urlpatterns = [
    path('', include(router.urls)),
    path('service-id/', get_service_id_by_name, name='get-service-id'),
    path('register/', ClientRegisterView.as_view(), name='client-register'),
    path('client-dashboard/', ClientDashboardView.as_view(), name='client-dashboard'),
    path('prices/', ServicePriceView.as_view(), name='service-prices'),
    path('api/validate-coupon/<str:code>/', validate_coupon, name='validate_coupon'),
    path('upload-pdf/', PDFUploadView.as_view(), name='upload_pdf'),
    path('view-pdf/<int:pk>/', generate_pdf_view, name='view_pdf'),

    # ✅ JWT Token Login & Refresh
    path('login/', ClientLoginView.as_view(), name='client_login'), 
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
