from django.db import models


class CopyPrice(models.Model):
    name=models.CharField(max_length=100)
    hard_copy_price=models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name