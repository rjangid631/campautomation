from django.db import models
from django.core.exceptions import ValidationError
from clients.models.client import Client

class ServiceSelection(models.Model):
    client = models.ForeignKey(
        Client,
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
        self.full_clean()
        super().save(*args, **kwargs)

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
        """
        Returns a list of all services across all packages with their total_case.
        """
        result = []
        for package in self.packages:
            for service, details in package.get("services", {}).items():
                result.append({
                    "package_name": package.get("package_name"),
                    "service": service,
                    "total_case": details.get("total_case", 0)
                })
        return result