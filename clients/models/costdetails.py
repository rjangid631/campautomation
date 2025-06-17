from django.db import models

from clients.models.client import Client


class CostDetails(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='cost_details', null=True)
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
        return f'{self.service_name} for client {self.client.client_id}'