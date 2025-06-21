from rest_framework import serializers
from clients.models.client import Client
from clients.models.camp import Camp

class CampSerializer(serializers.ModelSerializer):
    client = serializers.SlugRelatedField(
        slug_field='client_id',
        queryset=Client.objects.all()
    )

    class Meta:
        model = Camp
        fields = '__all__'