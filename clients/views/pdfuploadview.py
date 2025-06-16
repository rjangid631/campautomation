from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.views import APIView

from backend import settings
from clients.models.estimation import Estimation
from reportlab.pdfgen import canvas
import os


class PDFUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request, *args, **kwargs):
        return Response({'message': 'Use POST to upload a PDF'}, status=405)

    def post(self, request, *args, **kwargs):
        pdf_file = request.FILES.get('pdf')
        company_name = request.data.get('company_name', 'Unknown Company')

        estimation = Estimation.objects.create(
            company_name=company_name,
            pdf_file=pdf_file
        )

        return Response({'message': 'PDF uploaded successfully!', 'pdf_id': estimation.id})


def generate_pdf_view(request):
    # Create a PDF using ReportLab
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = 'attachment; filename="ESTIMATION_Q8ElAn1.pdf"'

    # Create the PDF (Example using ReportLab)
    p = canvas.Canvas(response)
    p.drawString(100, 100, "Hello, this is your PDF.")
    p.showPage()
    p.save()

    # Save the PDF to the specified path
    pdf_dir = os.path.join(settings.MEDIA_ROOT, 'estimations')
    os.makedirs(pdf_dir, exist_ok=True)  # Ensure directory exists
    pdf_path = os.path.join(pdf_dir, 'ESTIMATION_Q8ElAn1.pdf')
    
    with open(pdf_path, 'wb') as f:
        f.write(response.getvalue())

    return response
