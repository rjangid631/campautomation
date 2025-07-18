from rest_framework import serializers
from clients.models.costsummary import CostSummary

class CostSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = CostSummary
        fields = '__all__'