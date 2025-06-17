from django.db import models
from django.core.exceptions import ValidationError
from clients.models.client import Client

class ServiceSelection(models.Model):
    client = models.ForeignKey(
    'clients.Client', 
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

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.client.name} ({len(self.packages)} packages)"

    @property
    def selected_services(self):
        services = []
        for package in self.packages:
            services.extend(list(package.get("services", {}).keys()))
        return ', '.join(set(services)) if services else "No services"

    selected_services.fget.short_description = 'Selected Services'
