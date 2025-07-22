from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import viewsets, status
from clients.models.client import Client
from clients.models.costdetails import CostDetails
from clients.serializers.costdetails import CostDetailsSerializer


class CostDetailsViewSet(viewsets.ViewSet):
    def create(self, request):
        data = request.data
        print("📥 Backend received data:", data)
        print("📥 Data type:", type(data))
        client_code = data.get('clientId')
        cost_details = data.get('costDetails', {})

        if not client_code:
            return Response({'error': 'Client ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        client = get_object_or_404(Client, client_id=client_code)

        if not isinstance(cost_details, dict):
            return Response({'error': 'costDetails must be a dictionary'}, status=status.HTTP_400_BAD_REQUEST)

        for service_name, costs in cost_details.items():
            CostDetails.objects.update_or_create(
                client=client,
                service_name=service_name,
                defaults={
                    'food':       costs.get('food', 0),
                    'stay':       costs.get('stay', 0),
                    'travel':     costs.get('travel', 0),
                    'salary':     costs.get('salary', 0),
                    'misc':       costs.get('misc', 0),
                    'equipment':  costs.get('equipment', 0),
                    'consumables':costs.get('consumables', 0),
                    'reporting':  costs.get('reporting', 0),
                }
            )

        return Response({'message': 'Costs saved successfully'}, status=status.HTTP_201_CREATED)

    def list(self, request):
        client_code = request.query_params.get('clientId')  # Optional filtering
        if client_code:
            client = get_object_or_404(Client, client_id=client_code)
            queryset = CostDetails.objects.filter(client=client)
        else:
            queryset = CostDetails.objects.all()

        serializer = CostDetailsSerializer(queryset, many=True)
        return Response(serializer.data)
