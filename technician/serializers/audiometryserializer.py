from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import Table, TableStyle
from django.core.files.base import ContentFile
from rest_framework import serializers

from technician.Models.audiometry import Audiometry
from camp_manager.Models.Patientdata import PatientData

class AudiometrySerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)

    class Meta:
        model = Audiometry
        fields = '__all__'
        read_only_fields = ['pdf_report', 'patient']
        extra_kwargs = {
            'patient': {'read_only': True}
        }

    def create(self, validated_data):
        patient_unique_id = validated_data.pop('patient_unique_id')
        try:
            patient = PatientData.objects.get(unique_patient_id=patient_unique_id)
        except PatientData.DoesNotExist:
            raise serializers.ValidationError({"patient_unique_id": "Invalid or not found."})

        validated_data['patient'] = patient
        audiometry = super().create(validated_data)
        self.generate_pdf(audiometry)
        return audiometry

    def update(self, instance, validated_data):
        validated_data.pop('patient_unique_id', None)
        audiometry = super().update(instance, validated_data)
        self.generate_pdf(audiometry)
        return audiometry

    def generate_pdf(self, audiometry):
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        data = [
            ["Patient Name:", f"{audiometry.patient.patient_name}", "XRai ID:", "Our System generated ID"],
            ["Patient Age:", f"{audiometry.patient.age}", "Patient ID:", f"{audiometry.patient.unique_patient_id}"],
            ["Patient Gender :", f"{audiometry.patient.gender}", "Report Date/Time:", f"{audiometry.created_at.strftime('%d/%m/%y, %H:%M') if hasattr(audiometry, 'created_at') else 'N/A'}"],
            ["Test Date :", f"{audiometry.created_at.strftime('%d/%m/%y') if hasattr(audiometry, 'created_at') else 'N/A'}", "Referral Dr:", ""],
        ]

        table = Table(data, colWidths=[40*mm, 55*mm, 40*mm, 55*mm])
        table.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 1, colors.black),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
        ]))

        table.wrapOn(p, width, height)
        table.drawOn(p, 30*mm, height - 100*mm)

        y = height - 140*mm
        p.setFont("Helvetica", 10)
        for freq in ["250", "500", "1000", "2000", "4000", "8000"]:
            p.drawString(30*mm, y, f"Left Air {freq}Hz: {getattr(audiometry, f'left_air_{freq}', '')}")
            y -= 12
            p.drawString(30*mm, y, f"Right Air {freq}Hz: {getattr(audiometry, f'right_air_{freq}', '')}")
            y -= 18

        p.drawString(30*mm, y, f"Left Ear Finding: {audiometry.left_ear_finding}")
        y -= 12
        p.drawString(30*mm, y, f"Right Ear Finding: {audiometry.right_ear_finding}")
        p.showPage()
        p.save()

        buffer.seek(0)
        audiometry.pdf_report.save(
            f"audiometry_{audiometry.patient.unique_patient_id}.pdf",
            ContentFile(buffer.read()),
            save=True
        )
