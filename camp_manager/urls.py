from django.urls import path, include
from rest_framework.routers import DefaultRouter
from camp_manager.views import CampManagerViewSet, UploadExcelViewSet
from camp_manager.views.camp_manager import CampManagerUserViewSet

router = DefaultRouter()
router.register(r'users', CampManagerUserViewSet, basename='campmanager-user')
router.register(r'camps', CampManagerViewSet, basename='camp-manager')
router.register(r'upload', UploadExcelViewSet, basename='upload-excel')

urlpatterns = [
    path('', include(router.urls)),
]
