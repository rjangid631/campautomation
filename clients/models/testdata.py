from django.db import models
from clients.models.package import Package
from clients.models.client import Client
from clients.models.testtype import TestType  # Import this

class TestData(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, null=True, blank=True, related_name='test_data')
    service_name = models.CharField(max_length=255)
    case_per_day = models.IntegerField()
    number_of_days = models.IntegerField()
    total_case = models.IntegerField()
    package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True, blank=True)

    # ✅ Changed to ForeignKey
    report_type = models.ForeignKey(TestType, on_delete=models.SET_NULL, null=True, blank=True)
    report_type_cost = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        self.total_case = self.case_per_day * self.number_of_days
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.service_name} - {self.total_case} cases"
