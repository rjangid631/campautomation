from django.db import models

from clients.models.client import Client

class CostSummary(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True, related_name="cost_summaries")
    billing_number = models.CharField(max_length=255)
    camp_details = models.JSONField()
    service_details = models.JSONField()
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    # Optional fields from Company
    company_name = models.CharField(max_length=255, blank=True, null=True)
    company_state = models.CharField(max_length=255, blank=True, null=True)
    company_district = models.CharField(max_length=255, blank=True, null=True)
    company_pincode = models.CharField(max_length=10, blank=True, null=True)
    company_landmark = models.CharField(max_length=255, blank=True, null=True)
    company_address = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.company_name or self.client.name} - {self.billing_number}"