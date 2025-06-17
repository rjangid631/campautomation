from django.db import models

class Client(models.Model):
    client_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255, null=True, blank=True)  # Company name
    email = models.EmailField(unique=True)
    contact_number = models.CharField(max_length=15, unique=True)
    gst_number = models.CharField(max_length=15, unique=True)
    pan_card = models.CharField(max_length=10, unique=True)
    password = models.CharField(max_length=255)  # hashed password
    created_at = models.DateTimeField(auto_now_add=True)

    # Merged fields from Company model
    district = models.CharField(max_length=255, null=True, blank=True)
    state = models.CharField(max_length=255, null=True, blank=True)
    pin_code = models.CharField(max_length=10, null=True, blank=True)
    landmark = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return f"{self.client_id} - {self.name}"
