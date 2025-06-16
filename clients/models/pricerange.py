from django.db import models

from clients.models.service import Service

class PriceRange(models.Model):
    service = models.ForeignKey(Service, related_name='price_ranges', on_delete=models.CASCADE)
    max_cases = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.service.name}: Up to {self.max_cases} cases - ₹{self.price}'
    