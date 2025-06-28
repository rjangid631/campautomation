from datetime import datetime
from django.db import models
from django.core.exceptions import ValidationError
from django.utils.dateparse import parse_date

from clients.models.client import Client
from clients.models.camp import Camp
from clients.models.service import Service
from clients.models.package import Package

class ServiceSelection(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='service_selections'
    )
    camp = models.ForeignKey(
        Camp,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='service_selections'
    )
    packages = models.JSONField(default=list)

    class Meta:
        verbose_name = 'Service Selection'
        verbose_name_plural = 'Service Selections'

    def clean(self):
        if not isinstance(self.packages, list):
            raise ValidationError("Packages must be a list.")

        for package in self.packages:
            if not isinstance(package, dict) or "package_name" not in package or "services" not in package:
                raise ValidationError("Each package must be a dictionary with 'package_name' and 'services'.")

            services = package["services"]
            if not isinstance(services, dict):
                raise ValidationError("Services must be a dictionary.")

            for service_name, details in services.items():
                if not isinstance(details, dict):
                    raise ValidationError(f"Details for service '{service_name}' must be a dictionary.")
                if "total_case" not in details:
                    raise ValidationError(f"'total_case' missing for service '{service_name}'.")
                if not isinstance(details["total_case"], int) or details["total_case"] < 0:
                    raise ValidationError(f"'total_case' for service '{service_name}' must be a non-negative integer.")

    def save(self, *args, **kwargs):
        print("🔔 ServiceSelection.save() called")
        self.full_clean()
        super().save(*args, **kwargs)

        if self.client:
            print("📋 Saving packages for client:", self.client)
            print("🧩 Camp object:", self.camp)

            for pkg in self.packages:
                start_date_str = pkg.get("start_date")
                end_date_str = pkg.get("end_date")

                try:
                    start_date = datetime.strptime(start_date_str, "%d-%m-%Y").date()
                    end_date = datetime.strptime(end_date_str, "%d-%m-%Y").date()
                except ValueError:
                    print(f"❌ Invalid date format in package: {pkg}")
                    continue

                print(f"📦 Creating or getting package: {pkg.get('package_name')} ({start_date} - {end_date})")

                package_obj, created = Package.objects.get_or_create(
                    client=self.client,
                    camp=self.camp,
                    name=pkg.get("package_name"),
                    start_date=start_date,
                    end_date=end_date,
                )

                if not created:
                    print(f"⚠️ Package already exists: {package_obj}")
                    package_obj.services.clear()

                for service_name in pkg.get("services", {}).keys():
                    service = Service.objects.filter(name=service_name).first()
                    if service:
                        package_obj.services.add(service)

    def __str__(self):
        return f"{self.client.name if self.client else 'Unknown Client'} ({len(self.packages)} packages)"

    @property
    def selected_services(self):
        services = []
        for package in self.packages:
            for name, detail in package.get("services", {}).items():
                services.append(f"{name} ({detail.get('total_case', 0)})")
        return ', '.join(services) if services else "No services"

    selected_services.fget.short_description = 'Selected Services'

    def get_all_services_with_cases(self):
        result = []
        for package in self.packages:
            for service, details in package.get("services", {}).items():
                result.append({
                    "package_name": package.get("package_name"),
                    "service": service,
                    "total_case": details.get("total_case", 0)
                })
        return result
