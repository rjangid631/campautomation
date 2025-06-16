from django.db import models

class CompanyDetails(models.Model):
    company_name = models.CharField(max_length=255)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    super_company = models.CharField(max_length=255)

    def __str__(self):
        return self.company_name