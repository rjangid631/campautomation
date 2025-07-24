# technician/serializers/vitalsserializer.py

from rest_framework import serializers
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from django.core.files.base import ContentFile
from technician.Models import vitals
from technician.Models.vitals import Vitals
from camp_manager.Models.Patientdata import PatientData
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
)
from reportlab.lib.styles import getSampleStyleSheet
from django.core.files.base import ContentFile
from io import BytesIO
import os

class VitalsSerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)

    class Meta:
        model = Vitals
        fields = '__all__'
        read_only_fields = ['patient']
        extra_kwargs = {
            'patient': {'read_only': True}
        }

    def create(self, validated_data):
        unique_id = validated_data.pop('patient_unique_id')
        try:
            patient = PatientData.objects.get(unique_patient_id=unique_id)
        except PatientData.DoesNotExist:
            raise serializers.ValidationError({"patient_unique_id": "Invalid or not found."})

        validated_data['patient'] = patient

        existing = Vitals.objects.filter(patient=patient).first()
        if existing:
            for attr, value in validated_data.items():
                setattr(existing, attr, value)
            existing.save()
            self.generate_pdf(existing)
            return existing

        instance = super().create(validated_data)
        self.generate_pdf(instance)
        return instance

    def update(self, instance, validated_data):
        validated_data.pop('patient_unique_id', None)
        vitals = super().update(instance, validated_data)
        self.generate_pdf(vitals)
        return vitals

    def generate_pdf(self, vitals):
        page_width = A4[0]
        usable_width = page_width - 80          # side margins already subtracted

        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=40,
            leftMargin=40,
            topMargin=50,
            bottomMargin=50
        )
        elements = []
        styles = getSampleStyleSheet()

        # ------------------------------------------------------------------
        # Title
        # ------------------------------------------------------------------
        elements.append(Paragraph("Vitals Report", styles['Title']))
        elements.append(Spacer(1, 12))

        # ------------------------------------------------------------------
        # Patient Info Table (unchanged)
        # ------------------------------------------------------------------
        patient = vitals.patient
        test_date = getattr(patient, "test_date", None)
        formatted_test_date = test_date.strftime("%d/%m/%Y") if test_date else "N/A"
        report_time = vitals.created_at.strftime("%d/%m/%Y, %H:%M") if vitals.created_at else "N/A"

        patient_info_data = [
            ['Patient Name:', patient.patient_name, 'XRAi ID:', patient.unique_patient_id],
            ['Patient Age:', str(patient.age), 'Patient ID:', patient.patient_excel_id or "N/A"],
            ['Gender:', patient.gender, 'Report Date/Time:', report_time],
            ['Test Date:', formatted_test_date, 'Referral Dr:', 'N/A'],
        ]

        info_table = Table(
            patient_info_data,
            colWidths=[0.20 * usable_width, 0.30 * usable_width,
                    0.20 * usable_width, 0.30 * usable_width]
        )
        info_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(info_table)
        elements.append(Spacer(1, 20))


        # ------------------------------------------------------------------
        # Vitals Table (clean & spacious)
        # ------------------------------------------------------------------
        elements.append(Paragraph("Vitals", styles['Heading2']))
        elements.append(Spacer(1, 15))

        bmi = None
        if vitals.height and vitals.weight and float(vitals.height) > 0:
            bmi = round(float(vitals.weight) / ((float(vitals.height) / 100) ** 2), 1)

        vitals_data = [
            ['Parameters', 'Values'],
            ['Height (in cm)', str(vitals.height) if vitals.height else 'N/A'],
            ['Weight (in kg)', str(vitals.weight) if vitals.weight else 'N/A'],
            ['BMI (kg/m²)', str(bmi) if bmi is not None else 'N/A'],
            ['Blood Pressure (mmHg)', vitals.bp if vitals.bp else 'N/A'],
            ['Pulse (bpm)', str(vitals.pulse) if vitals.pulse else 'N/A'],
            ['Chest Inhale', vitals.chest_inhale if hasattr(vitals, 'chest_inhale') and vitals.chest_inhale else 'N/A'],
            ['Chest Exhale', vitals.chest_exhale if hasattr(vitals, 'chest_exhale') and vitals.chest_exhale else 'N/A'],
            ['Abdomen', vitals.abdomen if hasattr(vitals, 'abdomen') and vitals.abdomen else 'N/A'],
        ]


        # Wider columns, tall rows
        row_height = 12 * mm   # generous vertical space
        vitals_table = Table(
            vitals_data,
            colWidths=[0.55 * usable_width, 0.45 * usable_width],
            rowHeights=None  # Let it auto adjust
        )
        vitals_table._argW[0] = 0.55 * usable_width
        vitals_table._argW[1] = 0.45 * usable_width

        vitals_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(vitals_table)
        elements.append(Spacer(1, 10))
        # # ------------------------------------------------------------------
        # # Signature Block
        # # ------------------------------------------------------------------
        # elements.append(Paragraph("<b>Verified by:</b>", styles['Heading3']))
        # elements.append(Spacer(1, 8))
        # elements.append(Paragraph("N/A", styles['Normal']))
        # elements.append(Spacer(1, 30))

        # ------------------------------------------------------------------
        # Build & save PDF
        # ------------------------------------------------------------------
        doc.build(elements)
        buffer.seek(0)
        vitals.pdf_report.save(
            f"vitals_{vitals.patient.unique_patient_id}.pdf",
            ContentFile(buffer.read()),
            save=True
        )