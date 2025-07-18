from rest_framework import serializers
from clients.models.costdetails import CostDetails

class CostDetailsSerializer(serializers.ModelSerializer):
    class Meta:
        model = CostDetails
        fields = ['client', 'service_name', 'travel', 'stay', 'food', 'salary', 'misc', 'equipment', 'consumables', 'reporting']