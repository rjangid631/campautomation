from rest_framework import viewsets
from technician.Models.audiometrist import Audiometrist
from technician.serializers.audiometristserializer import AudiometristSerializer

class AudiometristViewSet(viewsets.ModelViewSet):
    queryset = Audiometrist.objects.all()
    serializer_class = AudiometristSerializer
