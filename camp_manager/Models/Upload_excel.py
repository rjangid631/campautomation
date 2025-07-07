from django.db import models
from clients.models.camp import Camp  # This is safe
# Do NOT import Package directly here!

class ExcelUpload(models.Model):
    file = models.FileField(upload_to='excel_uploads/')
    camp = models.ForeignKey(Camp, on_delete=models.CASCADE, related_name='excel_uploads')
    package = models.ForeignKey('clients.Package', on_delete=models.SET_NULL, null=True, blank=True)  # <-- string reference
    uploaded_at = models.DateTimeField(auto_now_add=True)
    unique_id = models.CharField(max_length=12, unique=True)

    def __str__(self):
        return f"{self.camp} - {self.package.name if self.package else 'No Package'} ({self.unique_id})"
