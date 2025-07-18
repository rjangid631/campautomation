import logging
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password
from technician.Models.technician import Technician

# Setup logger
logger = logging.getLogger(__name__)

@api_view(['POST'])
def technician_login(request):
    email = request.data.get('email')
    password = request.data.get('password')

    logger.info(f"Login attempt for technician email: {email}")

    try:
        technician = Technician.objects.get(user__email=email)
        logger.info(f"Technician found: {technician.user.email}")

        if technician.user.check_password(password):
            logger.info(f"Password matched for technician: {technician.user.email}")
            return Response({
                "status": "success",
                "technician_id": technician.id,
                "name": technician.user.name,
                "email": technician.user.email
            })
        else:
            logger.warning(f"Invalid password for technician: {technician.user.email}")
            return Response({"status": "error", "message": "Invalid password"}, status=401)

    except Technician.DoesNotExist:
        logger.error(f"Technician not found with email: {email}")
        return Response({"status": "error", "message": "Technician not found"}, status=404)
