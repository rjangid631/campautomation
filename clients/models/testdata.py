from django.db import models
from clients.models.client import Client  # Adjust the import based on your structure

class TestData(models.Model):
    client = models.ForeignKey(
    'clients.Client',
    on_delete=models.CASCADE,
    null=True,
    blank=True,
    related_name='test_data'
)
    service_name = models.CharField(max_length=255)
    case_per_day = models.IntegerField()
    number_of_days = models.IntegerField()
    total_case = models.IntegerField()

    def save(self, *args, **kwargs):
        self.total_case = self.case_per_day * self.number_of_days
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.service_name} - {self.total_case} cases"
