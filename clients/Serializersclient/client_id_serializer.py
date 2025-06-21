from rest_framework import serializers
from clients.models.client import Client

class ClientIDSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['client_id', 'name']