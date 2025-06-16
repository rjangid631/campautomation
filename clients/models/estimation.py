from django.db import models

class Estimation(models.Model):
    company_name = models.CharField(max_length=255)
    pdf_file = models.FileField(upload_to='estimations/')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.company_name} - {self.created_at}"
    
