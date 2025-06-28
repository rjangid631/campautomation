# camp_manager/views.py
from rest_framework import viewsets
from camp_manager.Models.Camp_manager import CampManager
from camp_manager.Serializers.campmanager import CampManagerSerializer
from rest_framework.permissions import IsAdminUser

class CampManagerUserViewSet(viewsets.ModelViewSet):
    queryset = CampManager.objects.all()
    serializer_class = CampManagerSerializer
    #permission_classes = [IsAdminUser]  # only admin can manage
