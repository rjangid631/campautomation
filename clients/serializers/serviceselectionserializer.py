from rest_framework import serializers
from clients.models.camp import Camp
from clients.models.client import Client
from clients.models.package import Package
from clients.models.serviceselection import ServiceSelection
from clients.models.service import Service
from datetime import datetime

from clients.models.testdata import TestData

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
    camp = serializers.PrimaryKeyRelatedField(
        queryset=Camp.objects.all(),
        write_only=False  # 👈 allows it to appear in the response
    )

    class Meta:
        model = ServiceSelection
        fields = ['id', 'client', 'camp', 'packages', 'selected_services']

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

                if not Service.objects.filter(name=service_name).exists():
                    raise serializers.ValidationError(
                        f"Service '{service_name}' in package '{package.get('package_name')}' does not exist."
                    )

        return value

    def create(self, validated_data):
            packages_data = validated_data.pop("packages")
            client = validated_data["client"]

            # ✅ Get camp from raw input
            camp_id = self.initial_data.get("camp")
            camp = None
            if camp_id:
                try:
                    camp = Camp.objects.get(id=camp_id)
                except Camp.DoesNotExist:
                    raise serializers.ValidationError({"camp": "Invalid camp ID"})

            # ✅ Create ServiceSelection
            service_selection = ServiceSelection.objects.create(
                client=client,
                camp=camp,
                packages=packages_data
            )

            # ✅ Create Package and TestData entries
            for pkg_data in packages_data:
                name = pkg_data['package_name']
                start_date = datetime.strptime(pkg_data['start_date'], '%d-%m-%Y').date()
                end_date = datetime.strptime(pkg_data['end_date'], '%d-%m-%Y').date()
                services = pkg_data['services']

                package, created = Package.objects.get_or_create(
                    client=client,
                    camp=camp,
                    name=name,
                    start_date=start_date,
                    end_date=end_date
                )

                for service_name, detail in services.items():
                    total_case = detail.get("total_case", 0)
                    service_obj, _ = Service.objects.get_or_create(name=service_name)
                    package.services.add(service_obj)

                    TestData.objects.create(
                        client=client,
                        package=package,
                        service_name=service_name,
                        total_case=total_case,
                        case_per_day=0,
                        number_of_days=0,
                        report_type=None
                    )

            self.created_packages = packages_data
            return service_selection

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['packages'] = self.created_packages if hasattr(self, 'created_packages') else instance.packages
        return data
