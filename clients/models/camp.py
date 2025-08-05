from django.db import models

from clients.models.client import Client


class Camp(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='camps', null=True, blank=True)
    location = models.CharField(max_length=255)
    district = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    pin_code = models.CharField(max_length=10)
    start_date = models.DateField()
    end_date = models.DateField()
    ready_to_go = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.client.name} - {self.location} ({self.start_date} to {self.end_date})"

    @property
    def name(self):
        return f"{self.client.name} - {self.location}"
