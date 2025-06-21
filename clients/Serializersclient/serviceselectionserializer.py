from rest_framework import serializers
from clients.models.client import Client
from clients.models.serviceselection import ServiceSelection
from clients.models.service import Service
from datetime import datetime

class ServiceSelectionSerializer(serializers.ModelSerializer):
    selected_services = serializers.ReadOnlyField()
    client = serializers.SlugRelatedField(
        slug_field='client_id',
        queryset=Client.objects.all()
    )
    packages = serializers.ListField(
        child=serializers.DictField(),
        write_only=True
    )

    class Meta:
        model = ServiceSelection
        fields = ['id', 'client', 'packages', 'selected_services']

    def validate_packages(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Packages must be a list.")

        for i, package in enumerate(value):
            if "package_name" not in package or "services" not in package:
                raise serializers.ValidationError(
                    f"Package at index {i} must include 'package_name' and 'services'."
                )

            start_date = package.get("start_date")
            end_date = package.get("end_date")

            if not start_date or not end_date:
                raise serializers.ValidationError(
                    f"Package '{package.get('package_name', f'at index {i}')}' must include 'start_date' and 'end_date'."
                )

            try:
                parsed_start = datetime.strptime(start_date, '%d-%m-%Y').date()
                parsed_end = datetime.strptime(end_date, '%d-%m-%Y').date()
                if parsed_start > parsed_end:
                    raise serializers.ValidationError(
                        f"'start_date' must be before 'end_date' in package '{package.get('package_name')}'."
                    )
            except ValueError:
                raise serializers.ValidationError(
                    f"Invalid date format in package '{package.get('package_name')}'; use 'DD-MM-YYYY'."
                )

            if not isinstance(package["services"], dict):
                raise serializers.ValidationError(
                    f"Services in package '{package.get('package_name')}' must be a dictionary."
                )

            for service_name, details in package["services"].items():
                if "total_case" not in details:
                    raise serializers.ValidationError(
                        f"'total_case' missing for service '{service_name}' in package '{package.get('package_name')}'."
                    )
                if not isinstance(details["total_case"], int) or details["total_case"] < 0:
                    raise serializers.ValidationError(
                        f"'total_case' for service '{service_name}' in package '{package.get('package_name')}' must be a non-negative integer."
                    )

                # Optional: validate service exists in DB
                if not Service.objects.filter(name=service_name).exists():
                    raise serializers.ValidationError(
                        f"Service '{service_name}' in package '{package.get('package_name')}' does not exist."
                    )

        return value

    def create(self, validated_data):
        packages_data = validated_data.pop("packages")
        client = validated_data["client"]

        # ✅ Save packages JSON into the model
        service_selection = ServiceSelection.objects.create(
            client=client,
            packages=packages_data
        )

        # ✅ Store for custom response
        self.created_packages = packages_data

        return service_selection

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['packages'] = self.created_packages if hasattr(self, 'created_packages') else instance.packages
        return data
