from rest_framework import serializers
from clients.models.servicecost import ServiceCost


class ServiceCostSerializer(serializers.ModelSerializer):
    test_type_name = serializers.CharField(source='test_type.name', read_only=True)

    class Meta:
        model = ServiceCost
        fields = ['test_type_name', 'salary', 'incentive', 'misc', 'equipment','consumables','reporting']
