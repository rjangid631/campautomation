from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
import traceback
from clients.models.serviceselection import ServiceSelection
from clients.serializers.serviceselectionserializer import ServiceSelectionSerializer
from clients.models.package import Package
from clients.serializers.packageserializer import PackageSerializer

class ServiceSelectionViewSet(viewsets.ModelViewSet):
    queryset = ServiceSelection.objects.all()
    serializer_class = ServiceSelectionSerializer

    def create(self, request, *args, **kwargs):
        try:
            print("📥 Incoming request data:", request.data)

            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            print("✅ Serializer validated data:", serializer.validated_data)

            instance = serializer.save()

            # ✅ Fetch related packages with full data (including `id`)
            camp = instance.camp
            client = instance.client
            related_packages = Package.objects.filter(client=client, camp=camp).order_by('-id')[:len(request.data.get("packages", []))]

            package_serializer = PackageSerializer(related_packages, many=True)

            response_data = {
                "success": True,
                "message": "Service selection saved successfully.",
                "data": {
                    "packages": package_serializer.data  # ✅ frontend expects this
                }
            }

            return Response(response_data, status=status.HTTP_201_CREATED)

        except ValidationError as ve:
            print("❌ Validation error:", ve.detail)
            return Response({"detail": ve.detail}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            print("❌ Internal Server Error in ServiceSelectionViewSet.create()")
            traceback.print_exc()
            return Response(
                {
                    "error": str(e),
                    "message": "An internal server error occurred while creating service selection."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )