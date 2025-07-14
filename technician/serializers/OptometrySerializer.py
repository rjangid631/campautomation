from rest_framework import serializers
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import Table, TableStyle
from django.core.files.base import ContentFile

from technician.Models.optometry import Optometry
from camp_manager.Models.Patientdata import PatientData

class OptometrySerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)

    class Meta:
        model = Optometry
        fields = '__all__'
        read_only_fields = ['pdf_report', 'patient']

    def create(self, validated_data):
        unique_id = validated_data.pop('patient_unique_id')
        try:
            patient = PatientData.objects.get(unique_patient_id=unique_id)
        except PatientData.DoesNotExist:
            raise serializers.ValidationError({"patient_unique_id": "Invalid or not found."})

        validated_data['patient'] = patient
        instance = super().create(validated_data)
        self.generate_pdf(instance)
        return instance

    def update(self, instance, validated_data):
        validated_data.pop('patient_unique_id', None)
        instance = super().update(instance, validated_data)
        self.generate_pdf(instance)
        return instance

    def generate_pdf(self, optometry):
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Table for patient info
        data = [
            ["Patient Name:", optometry.patient.patient_name, "Patient ID:", optometry.patient.unique_patient_id],
            ["Age:", str(optometry.patient.age), "Gender:", optometry.patient.gender],
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

        # Vision and color details
        y = height - 140*mm
        p.setFont("Helvetica", 10)

        p.drawString(30*mm, y, f"Far Vision Right: {optometry.far_vision_right}")
        y -= 12
        p.drawString(30*mm, y, f"Far Vision Left: {optometry.far_vision_left}")
        y -= 12
        p.drawString(30*mm, y, f"Near Vision Right: {optometry.near_vision_right}")
        y -= 12
        p.drawString(30*mm, y, f"Near Vision Left: {optometry.near_vision_left}")
        y -= 12
        p.drawString(30*mm, y, f"Color Vision Normal: {'Yes' if optometry.color_vision_normal else 'No'}")
        y -= 12
        p.drawString(30*mm, y, f"Other Color Vision Issues: {optometry.color_vision_other or 'N/A'}")

        p.showPage()
        p.save()

        buffer.seek(0)
        optometry.pdf_report.save(
            f"optometry_{optometry.patient.unique_patient_id}.pdf",
            ContentFile(buffer.read()),
            save=True
        )
