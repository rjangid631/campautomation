from django.db import models 

class Client(models.Model):
    client_id = models.CharField(max_length=20, unique=True)
    email = models.EmailField(unique=True)
    contact_number = models.CharField(max_length=15, unique=True)
    gst_number = models.CharField(max_length=15, unique=True)
    pan_card = models.CharField(max_length=10, unique=True)
    password = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.client_id