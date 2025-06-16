from django.db import models

class Camp(models.Model):
    company = models.ForeignKey('Company', on_delete=models.CASCADE, related_name='camps')
    location = models.CharField(max_length=255)
    district = models.CharField(max_length=255)
    state = models.CharField(max_length=255)
    pin_code = models.CharField(max_length=10)
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.company.name} - {self.location} ({self.start_date} to {self.end_date})"