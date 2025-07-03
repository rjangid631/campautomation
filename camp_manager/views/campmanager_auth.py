# camp_manager/views/campmanager_auth.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password, check_password
from camp_manager.Models.Camp_manager import CampManager
from camp_manager.Serializers.campmanager import CampManagerSerializer


class CampManagerRegisterView(APIView):
    def post(self, request):
        data = request.data.copy()
        data['password'] = make_password(data['password'])  # 🔐 Hash password
        serializer = CampManagerSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Camp Manager registered successfully'}, status=201)
        return Response(serializer.errors, status=400)


class CampManagerLoginView(APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")

        user = CampManager.objects.filter(email=email).first()
        if user and check_password(password, user.password):
            return Response({
                "message": "Login successful",
                "camp_manager_id": user.id,
                "email": user.email,
                "name": user.name
            })
        return Response({"error": "Invalid email or password"}, status=401)
