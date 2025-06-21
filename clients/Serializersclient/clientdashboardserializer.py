from rest_framework import serializers
from clients.models.client import Client
from clients.models.serviceselection import ServiceSelection
from datetime import datetime
from collections import defaultdict

class ClientDashboardSerializer(serializers.ModelSerializer):
    datenow = serializers.SerializerMethodField()
    services = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = [
            'client_id', 'name', 'gst_number', 'email', 'contact_number',
            'created_at', 'district', 'state', 'pin_code', 'landmark',
            'datenow', 'services'
        ]

    def get_datenow(self, obj):
        return datetime.now().date().isoformat()

    def get_services(self, obj):
        # ✅ Correct: Filter by client directly, not camp
        service_selections = ServiceSelection.objects.filter(client=obj)

        # Aggregate total_cases per service
        service_totals = defaultdict(int)
        for selection in service_selections:
            for package in selection.packages:
                services = package.get("services", {})
                for service_name, service_data in services.items():
                    service_totals[service_name] += service_data.get("total_case", 0)

        # Format as a list of dicts
        return [
            {"service_name": name, "total_cases": total}
            for name, total in service_totals.items()
        ]
