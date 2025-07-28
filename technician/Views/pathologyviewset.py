# technician/views/pathology_views.py

from rest_framework import viewsets, filters
from technician.Models.pathology import Pathology
from technician.serializers.pathologyserializer import PathologySerializer

class PathologyViewSet(viewsets.ModelViewSet):
    queryset = Pathology.objects.select_related('patient').all()
    serializer_class = PathologySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['patient__unique_patient_id', 'patient__patient_name']
