from django.urls import path, include
from rest_framework.routers import DefaultRouter
from clients.views.clientcampviewlist import ClientCampViewSet
from clients.views.ServicePriceView import ServicePriceView
from clients.views.CompanyDetailsView import CompanyDetailsViewSet
from clients.views.CostDetailsview import CostDetailsViewSet
from clients.views.Costsummaryview import CostSummaryViewSet
from clients.views.ServiceCostView import ServiceCostViewSet, validate_coupon
from clients.views.Serviceselectionview import ServiceSelectionViewSet
from clients.views.Testcaseview import TestCaseDataViewSet
from clients.views.companyview import CompanyViewSet
from clients.views.copypriceview import CopyPriceViewSet
from clients.views.pdfuploadview import PDFUploadView, generate_pdf_view
from clients.views.userview import UserViewSet
from clients.views.clientview import ClientRegisterView
from clients.views.campview import CampViewSet


router = DefaultRouter()
router.register(r'companies', CompanyViewSet)
router.register(r'camps', CampViewSet)
router.register(r'serviceselection', ServiceSelectionViewSet, basename='service-selection')
router.register(r'test-case-data', TestCaseDataViewSet, basename='test-case-data')
router.register(r'cost_details', CostDetailsViewSet, basename='cost_details')
router.register(r'service_costs', ServiceCostViewSet)
router.register(r'costsummaries', CostSummaryViewSet)
router.register(r'copyprice', CopyPriceViewSet)
router.register(r'company-details', CompanyDetailsViewSet)
router.register(r'users', UserViewSet)
router.register(r'my-camps', ClientCampViewSet, basename='client-camps')

urlpatterns = [
    path('', include(router.urls)),
    path('register/', ClientRegisterView.as_view(), name='client-register'),  # Client registration endpoint
    path('prices/', ServicePriceView.as_view(), name='service-prices'),
    path('api/validate-coupon/<str:code>/', validate_coupon, name='validate_coupon'),
    path('upload-pdf/', PDFUploadView.as_view(), name='upload_pdf'),
    path('view-pdf/<int:pk>/', generate_pdf_view, name='view_pdf'),
]
