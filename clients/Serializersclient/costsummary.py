from clients.models.costsummary import CostSummary
from rest_framework import serializers

class CostSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = CostSummary
        fields = '__all__'