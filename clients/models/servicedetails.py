from django.db import models

from clients.models.companydetails import CompanyDetails

class ServiceDetails(models.Model):
    company = models.ForeignKey(CompanyDetails, related_name='services', on_delete=models.CASCADE)
    service_name = models.CharField(max_length=255)
    total_cases = models.IntegerField()

    def __str__(self):
        return f"{self.service_name} for {self.company.company_name}"
    