from rest_framework import serializers
from io import BytesIO
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from django.core.files.base import ContentFile
from technician.Models.optometry import Optometry
from camp_manager.Models.Patientdata import PatientData
import os

class OptometrySerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)
    technician_id = serializers.IntegerField(write_only=True, required=False)  # ✅ Add this

    class Meta:
        model = Optometry
        fields = '__all__'
        read_only_fields = ['pdf_report', 'patient']

    def get_optometrist_from_technician(self, technician_id):
        from technician.Models.optometrists import Optometrist  # ✅ Adjust import path if needed
        try:
            return Optometrist.objects.get(technician_id=technician_id)
        except Optometrist.DoesNotExist:
            return None

    def create(self, validated_data):
        unique_id = validated_data.pop('patient_unique_id')
        technician_id = validated_data.pop('technician_id', None)  # ✅ Extract technician_id

        try:
            patient = PatientData.objects.get(unique_patient_id=unique_id)
        except PatientData.DoesNotExist:
            raise serializers.ValidationError({"patient_unique_id": "Invalid or not found."})

        validated_data['patient'] = patient

        # ✅ Automatically map optometrist if not sent
        if technician_id and 'optometrist' not in validated_data:
            optometrist = self.get_optometrist_from_technician(technician_id)
            if optometrist:
                validated_data['optometrist'] = optometrist

        existing = Optometry.objects.filter(patient=patient).first()
        if existing:
            # If updating, preserve existing optometrist if not in request
            if 'optometrist' not in validated_data:
                validated_data['optometrist'] = existing.optometrist

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
        validated_data.pop('technician_id', None)  # ✅ Ignore during update
        instance = super().update(instance, validated_data)
        self.generate_pdf(instance)
        return instance

    def generate_pdf(self, optometry):
        page_width = A4[0]
        usable_width = page_width - 80
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=50, bottomMargin=50)
        elements = []
        styles = getSampleStyleSheet()

        # Title
        elements.append(Paragraph("Optometry Report", styles['Title']))
        elements.append(Spacer(1, 12))

        # Patient Info Table
        patient = optometry.patient
        test_date = getattr(patient, "test_date", None)
        formatted_test_date = test_date.strftime("%d/%m/%Y") if test_date else "N/A"
        report_time = optometry.created_at.strftime("%d/%m/%Y, %H:%M") if optometry.created_at else "N/A"

        patient_info_data = [
            ['Patient Name:', patient.patient_name, 'XRAi ID:', patient.unique_patient_id],
            ['Patient Age:', str(patient.age), 'Patient ID:', patient.patient_excel_id or "N/A"],
            ['Gender:', patient.gender, 'Report Date/Time:', report_time],
            ['Test Date:', formatted_test_date, 'Referral Dr:', 'N/A'],
        ]

        info_table = Table(patient_info_data, colWidths=[
            0.20 * usable_width, 0.30 * usable_width,
            0.20 * usable_width, 0.30 * usable_width
        ])
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

        # Visual Activity Table
        elements.append(Paragraph("Visual Acuity", styles['Heading2']))
        elements.append(Spacer(1, 10))

        acuity_data = [
            ['Eye', 'Distance (Vision)', 'Reading (Vision)', 'Spherical', 'Cylindrical', 'Axis', 'Add'],
            ['Right Eye',
             optometry.far_vision_right or 'N/A',
             optometry.near_vision_right or 'N/A',
             optometry.spherical_right or 'N/A',
             optometry.cylindrical_right or 'N/A',
             optometry.axis_right or 'N/A',
             optometry.add_right or 'N/A'],
            ['Left Eye',
             optometry.far_vision_left or 'N/A',
             optometry.near_vision_left or 'N/A',
             optometry.spherical_left or 'N/A',
             optometry.cylindrical_left or 'N/A',
             optometry.axis_left or 'N/A',
             optometry.add_left or 'N/A'],
        ]

        acuity_table = Table(acuity_data, colWidths=[
            0.16 * usable_width,
            0.16 * usable_width,
            0.16 * usable_width,
            0.14 * usable_width,
            0.14 * usable_width,
            0.12 * usable_width,
            0.12 * usable_width,
        ])
        acuity_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.whitesmoke, colors.lightgrey]),
        ]))
        elements.append(acuity_table)
        elements.append(Spacer(1, 20))

        # Color Vision Check
        if optometry.color_vision_remark:
            color_vision_text = f"Color vision check (Ishihara test): {optometry.color_vision_remark}"
        elif optometry.color_vision_normal:
            color_vision_text = "Color vision check (Ishihara test): Normal vision in both eyes."
        else:
            color_vision_text = f"Color vision check (Ishihara test): Issue noted: {optometry.color_vision_other or 'N/A'}"

        elements.append(Paragraph(color_vision_text, styles['Normal']))
        elements.append(Spacer(1, 12))

        # Summary
        summary = f"""<b>Visual Acuity:</b><br/>
        Distance (Far): {optometry.far_vision_right or 'N/A'} right – {optometry.near_vision_right or 'N/A'} near.<br/>
        Distance (Far): {optometry.far_vision_left or 'N/A'} left – {optometry.near_vision_left or 'N/A'} near."""
        elements.append(Paragraph(summary, styles['Normal']))
        elements.append(Spacer(1, 30))

        # Signature Block
        elements.append(Spacer(1, 30))
        elements.append(Paragraph("<b>Verified by:</b>", styles['Heading3']))
        elements.append(Spacer(1, 8))

        opto = getattr(optometry, 'optometrist', None)
        if opto:
            if opto.signature and hasattr(opto.signature, "path") and os.path.exists(opto.signature.path):
                try:
                    img = Image(opto.signature.path, width=120, height=40)
                    img.hAlign = 'LEFT'
                    elements.append(img)
                except Exception:
                    elements.append(Paragraph("Signature could not be loaded.", styles['Italic']))
            else:
                elements.append(Paragraph("Signature not available", styles['Normal']))

            elements.append(Spacer(1, 8))
            elements.append(Paragraph(f"<b>{opto.name or 'N/A'}</b>", styles['Normal']))
            elements.append(Paragraph(opto.designation or "Optometrist", styles['Normal']))
        else:
            elements.append(Paragraph("Optometrist: N/A", styles['Normal']))

        # Save PDF
        doc.build(elements)
        buffer.seek(0)
        optometry.pdf_report.save(
            f"optometry_{optometry.patient.unique_patient_id}.pdf",
            ContentFile(buffer.read()),
            save=True
        )
