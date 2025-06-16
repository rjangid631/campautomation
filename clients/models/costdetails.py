from django.db import models


class CostDetails(models.Model):
    company_id = models.IntegerField()
    service_name = models.CharField(max_length=255)
    travel = models.IntegerField(default=0)
    stay = models.IntegerField(default=0)
    food = models.IntegerField(default=0)
    salary = models.IntegerField(default=0)
    misc = models.IntegerField(default=0)
    equipment = models.IntegerField(default=0)
    consumables = models.IntegerField(default=0)
    reporting = models.IntegerField(default=0)



    def __str__(self):
        return f'{self.service_name} for company {self.company_id}'
    