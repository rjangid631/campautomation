from django.db import models
from clients.models.camp import Camp
from clients.models.package import Package

class ExcelUpload(models.Model):
    file = models.FileField(upload_to='excel_uploads/')
    camp = models.ForeignKey(Camp, on_delete=models.CASCADE, related_name='excel_uploads')
    package = models.ForeignKey(Package, on_delete=models.SET_NULL, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    unique_id = models.CharField(max_length=12, unique=True)

    def __str__(self):
        return f"{self.camp} - {self.package.name} ({self.unique_id})"
