from django.db import models

class CostSummary(models.Model):
    company_id = models.CharField(max_length=255)
    billing_number = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    company_state = models.CharField(max_length=255, blank=True, null=True)
    company_district = models.CharField(max_length=255, blank=True, null=True)
    company_pincode = models.CharField(max_length=10, blank=True, null=True)
    company_landmark = models.CharField(max_length=255, blank=True, null=True)
    company_address = models.TextField(blank=True, null=True)
    camp_details = models.JSONField()  # Store camp locations and dates as JSON
    service_details = models.JSONField()  # Store service details as JSON
    grand_total = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_name} - {self.billing_number}"
    