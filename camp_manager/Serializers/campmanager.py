# camp_manager/serializers.py
from rest_framework import serializers
from camp_manager.Models.Camp_manager import CampManager

class CampManagerSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampManager
        fields = ['id', 'email', 'name', 'contact_number', 'is_active']
