# store/serializers/audiometry.py

from rest_framework import serializers
from technician.Models.audiometry import Audiometry
from reportlab.pdfgen import canvas
from io import BytesIO
from django.core.files.base import ContentFile

class AudiometrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Audiometry
        fields = '__all__'
        read_only_fields = ['pdf_report']

    def create(self, validated_data):
        audiometry = super().create(validated_data)
        self.generate_pdf(audiometry)
        return audiometry

    def update(self, instance, validated_data):
        audiometry = super().update(instance, validated_data)
        self.generate_pdf(audiometry)
        return audiometry

    def generate_pdf(self, audiometry):
        buffer = BytesIO()
        p = canvas.Canvas(buffer)

        p.drawString(100, 800, f"Audiometry Report for {audiometry.patient.patient_name}")
        p.drawString(100, 780, f"Patient ID: {audiometry.patient.unique_patient_id}")
        p.drawString(100, 760, f"Age: {audiometry.patient.age}")
        p.drawString(100, 740, f"Gender: {audiometry.patient.gender}")

        y = 700
        for freq in ["250", "500", "1000", "2000", "4000", "8000"]:
            p.drawString(100, y, f"Left Air {freq}Hz: {getattr(audiometry, f'left_air_{freq}', '')}")
            y -= 15
            p.drawString(100, y, f"Right Air {freq}Hz: {getattr(audiometry, f'right_air_{freq}', '')}")
            y -= 20

        p.drawString(100, y, f"Left Ear Finding: {audiometry.left_ear_finding}")
        y -= 15
        p.drawString(100, y, f"Right Ear Finding: {audiometry.right_ear_finding}")
        p.showPage()
        p.save()

        buffer.seek(0)
        audiometry.pdf_report.save(
            f"audiometry_{audiometry.patient.unique_patient_id}.pdf",
            ContentFile(buffer.read()),
            save=True
        )
