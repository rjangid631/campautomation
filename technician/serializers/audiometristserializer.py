from rest_framework import serializers
from technician.Models.audiometrist import Audiometrist

class AudiometristSerializer(serializers.ModelSerializer):
    class Meta:
        model = Audiometrist
        fields = ['id', 'technician', 'user', 'name', 'designation', 'signature']
