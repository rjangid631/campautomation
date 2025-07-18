# technician/Views/dentist.py

from rest_framework import viewsets, permissions
from rest_framework.permissions import AllowAny
from technician.Models.dentist import Dentist
from technician.serializers.dentistserializer import DentistSerializer

class DentistViewSet(viewsets.ModelViewSet):
    queryset = Dentist.objects.all()
    serializer_class = DentistSerializer
    permission_classes = [AllowAny]  # Adjust permissions as needed

    def get_queryset(self):
        # Optionally filter by logged-in user's technician
        user = self.request.user
        if hasattr(user, 'technician'):
            return Dentist.objects.filter(technician=user.technician)
        return super().get_queryset()
