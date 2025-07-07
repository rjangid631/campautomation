from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password

from technician.Models.technician import Technician

@api_view(['POST'])
def technician_login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    try:
        technician = Technician.objects.get(email=email)
        if check_password(password, technician.password):
            return Response({
                "status": "success",
                "technician_id": technician.id,
                "name": technician.name,
                "email": technician.email
            })
        else:
            return Response({"status": "error", "message": "Invalid password"}, status=401)
    except Technician.DoesNotExist:
        return Response({"status": "error", "message": "Technician not found"}, status=404)
