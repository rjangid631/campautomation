from rest_framework.response import Response
from rest_framework import viewsets, status
from clients.Serializersclient.costdetails import CostDetailsSerializer
from clients.models.costdetails import CostDetails

class CostDetailsViewSet(viewsets.ViewSet):
    def create(self, request):
        data = request.data
        company_id = data.get('companyId')
        cost_details = data.get('costDetails', {})

        if not company_id:
            return Response({'error': 'Company ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        for service, costs in cost_details.items():
            CostDetails.objects.update_or_create(
                company_id=company_id,
                service_name=service,
                defaults={
                    
                    
                    'food': costs.get('food', 0),
                    
                    'stay': costs.get('stay', 0),
                    
                    'travel': costs.get('travel', 0),

                    'salary': costs.get('salary', 0),

                    'misc': costs.get('misc', 0),

                    'equipment': costs.get('equiment', 0),

                    'consumables': costs.get('consumables', 0),

                    'reporting': costs.get('reporting', 0),
                    
                    
                }
            )

        return Response({'message': 'Costs saved successfully'}, status=status.HTTP_201_CREATED)
    
    # Optionally, add a list method if you need to handle GET requests
    def list(self, request):
        queryset = CostDetails.objects.all()
        serializer = CostDetailsSerializer(queryset, many=True)
        return Response(serializer.data)
    