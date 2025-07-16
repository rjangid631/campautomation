from rest_framework import serializers
from technician.Models.optometrists import Optometrist

class OptometristSerializer(serializers.ModelSerializer):
    class Meta:
        model = Optometrist
        fields = ['id', 'user', 'name', 'designation', 'signature']
