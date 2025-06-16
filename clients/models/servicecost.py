from django.db import models

from clients.models.testtype import TestType

class ServiceCost(models.Model):
    test_type = models.OneToOneField(TestType, on_delete=models.CASCADE)
    salary = models.DecimalField(max_digits=10, decimal_places=2)
    incentive = models.DecimalField(max_digits=10, decimal_places=2)
    misc = models.DecimalField(max_digits=10, decimal_places=2)
    equipment = models.DecimalField(max_digits=10, decimal_places=2)
    consumables= models.DecimalField(max_digits=10, decimal_places=2)
    reporting= models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.test_type.name} Costs"
    