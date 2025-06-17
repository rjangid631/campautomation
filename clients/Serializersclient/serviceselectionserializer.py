from rest_framework import serializers
from clients.models.serviceselection import ServiceSelection

class ServiceSelectionSerializer(serializers.ModelSerializer):
    selected_services = serializers.ReadOnlyField()

    class Meta:
        model = ServiceSelection
        fields = ['id', 'client', 'packages', 'selected_services']

    def validate_packages(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Packages must be a list.")

        for package in value:
            if "package_name" not in package or "services" not in package:
                raise serializers.ValidationError("Each package must include 'package_name' and 'services'.")

            if not isinstance(package["services"], dict):
                raise serializers.ValidationError("Services must be a dictionary.")

            for service_name, details in package["services"].items():
                if not isinstance(details, dict):
                    raise serializers.ValidationError(f"Service '{service_name}' must be a dictionary.")

                if "total_case" not in details:
                    raise serializers.ValidationError(f"'total_case' missing for service '{service_name}'.")

                if not isinstance(details["total_case"], int) or details["total_case"] < 0:
                    raise serializers.ValidationError(f"'total_case' for service '{service_name}' must be a non-negative integer.")

        return value
