from rest_framework.response import Response
from rest_framework import viewsets, status
from clients.serializers.costdetails import CostDetailsSerializer
from clients.models.costdetails import CostDetails
from clients.models.client import Client

class CostDetailsViewSet(viewsets.ViewSet):
    def create(self, request):
        data = request.data
        client_id = data.get('clientId')  # changed from companyId to clientId
        cost_details = data.get('costDetails', {})

        if not client_id:
            return Response({'error': 'Client ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            client = Client.objects.get(id=client_id)
        except Client.DoesNotExist:
            return Response({'error': 'Client not found'}, status=status.HTTP_404_NOT_FOUND)

        if not isinstance(cost_details, dict):
            return Response({'error': 'costDetails must be a dictionary'}, status=status.HTTP_400_BAD_REQUEST)

        for service_name, costs in cost_details.items():
            try:
                CostDetails.objects.update_or_create(
                    client=client,
                    service_name=service_name,
                    defaults={
                        'food': costs.get('food', 0),
                        'stay': costs.get('stay', 0),
                        'travel': costs.get('travel', 0),
                        'salary': costs.get('salary', 0),
                        'misc': costs.get('misc', 0),
                        'equipment': costs.get('equipment', 0),
                        'consumables': costs.get('consumables', 0),
                        'reporting': costs.get('reporting', 0),
                    }
                )
            except Exception as e:
                return Response({'error': f'Failed to save cost for {service_name}: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Costs saved successfully'}, status=status.HTTP_201_CREATED)

    def list(self, request):
        queryset = CostDetails.objects.all()
        serializer = CostDetailsSerializer(queryset, many=True)
        return Response(serializer.data)
