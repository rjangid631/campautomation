from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from technician.Models.audiometrist import Audiometrist

class AudiometristSignatureView(APIView):

    def get_technician_id(self, request):
        if request.method == 'POST':
            return request.data.get("technician_id")
        return request.query_params.get("technician_id")

    def get(self, request):
        return self.handle_signature_request(request)

    def post(self, request):
        return self.handle_signature_request(request)

    def handle_signature_request(self, request):
        technician_id = self.get_technician_id(request)

        if not technician_id:
            return Response({"error": "technician_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            audiometrist = Audiometrist.objects.get(technician_id=technician_id)
            if audiometrist.signature:
                return Response({
                    "name": audiometrist.name,
                    "designation": audiometrist.designation,
                    "signature_url": request.build_absolute_uri(audiometrist.signature.url)
                })
            return Response({"error": "Signature not uploaded"}, status=404)
        except Audiometrist.DoesNotExist:
            return Response({"error": "Audiometrist not found"}, status=404)
