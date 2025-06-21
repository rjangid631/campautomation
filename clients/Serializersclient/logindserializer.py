from rest_framework import serializers
from clients.models.client import Client
from django.contrib.auth.hashers import check_password

class ClientLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get("email")
        password = data.get("password")

        try:
            client = Client.objects.get(email=email)
        except Client.DoesNotExist:
            raise serializers.ValidationError("Client with this email does not exist.")

        if not check_password(password, client.password):
            raise serializers.ValidationError("Incorrect password.")

        # ✅ Attach client for use in view
        data['client'] = client
        return data
