from rest_framework import serializers
from clients.models.client import Client
from django.contrib.auth.hashers import make_password


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = ['id', 'client_id', 'name', 'email', 'password', 'contact_number', 'login_type']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        validated_data['password'] = make_password(validated_data['password'])
        return super().create(validated_data)