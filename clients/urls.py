from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken import views
from clients.views.clientdashboard import ClientDashboardView
from clients.views.loginview import ClientLoginView
from clients.views.clientcampviewlist import ClientCampViewSet
from clients.views.ServicePriceView import ServicePriceView
from clients.views.CostDetailsview import CostDetailsViewSet
from clients.views.Costsummaryview import CostSummaryViewSet
from clients.views.ServiceCostView import ServiceCostViewSet, validate_coupon
from clients.views.Serviceselectionview import ServiceSelectionViewSet
from clients.views.Testcaseview import TestCaseDataViewSet
from clients.views.copypriceview import CopyPriceViewSet
from clients.views.pdfuploadview import PDFUploadView, generate_pdf_view
from clients.views.clientview import ClientRegisterView
from clients.views.serviceviewset import ServiceViewSet
from clients.views.packageview import PackageViewSet

router = DefaultRouter()
router.register(r'camps', ClientCampViewSet, basename='camps')  # ✅ allows GET + POST for authenticated clients
router.register(r'serviceselection', ServiceSelectionViewSet, basename='service-selection')
router.register(r'test-case-data', TestCaseDataViewSet, basename='test-case-data')
router.register(r'cost_details', CostDetailsViewSet, basename='cost_details')
router.register(r'service_costs', ServiceCostViewSet)
router.register(r'costsummaries', CostSummaryViewSet)
router.register(r'copyprice', CopyPriceViewSet)
router.register(r'services', ServiceViewSet)
router.register(r'packages', PackageViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', ClientLoginView.as_view(), name='client-login'),
    path('register/', ClientRegisterView.as_view(), name='client-register'),
    path('client-dashboard/', ClientDashboardView.as_view(), name='client-dashboard'),
    path('api-token-auth/', views.obtain_auth_token),
    path('prices/', ServicePriceView.as_view(), name='service-prices'),
    path('api/validate-coupon/<str:code>/', validate_coupon, name='validate_coupon'),
    path('upload-pdf/', PDFUploadView.as_view(), name='upload_pdf'),
    path('view-pdf/<int:pk>/', generate_pdf_view, name='view_pdf'),
]
