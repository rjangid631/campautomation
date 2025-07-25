from rest_framework import serializers
from io import BytesIO
from django.core.files.base import ContentFile
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import os

from technician.Models.doctorconsultation import DoctorConsultation
from camp_manager.Models.Patientdata import PatientData
from technician.Models.doctors import Doctor

from camp_manager.Serializers.patientdataserializer import PatientDataSerializer
from technician.serializers.doctor_serializer import DoctorSerializer


class DoctorConsultationSerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)
    technician_id = serializers.IntegerField(write_only=True, required=False)  # ✅ Add technician_id for lookup

    patient = PatientDataSerializer(read_only=True)
    doctor = DoctorSerializer(read_only=True)

    class Meta:
        model = DoctorConsultation
        fields = '__all__'
        read_only_fields = ['pdf_report', 'patient', 'doctor']

    def get_doctor_from_technician(self, technician_id):
        from technician.Models.doctors import Doctor
        try:
            technician_id = int(technician_id)  # <-- Ensure it's an integer
            return Doctor.objects.get(technician_id=technician_id)
        except (Doctor.DoesNotExist, ValueError, TypeError):
            return None

    def create(self, validated_data):
        unique_id = validated_data.pop('patient_unique_id')
        technician_id = validated_data.pop('technician_id', None)

        try:
            patient = PatientData.objects.get(unique_patient_id=unique_id)
        except PatientData.DoesNotExist:
            raise serializers.ValidationError({"patient_unique_id": "Patient not found."})

        # ✅ Assign doctor from technician_id
        doctor = None
        if technician_id:
            doctor = self.get_doctor_from_technician(technician_id)

        if not doctor:
            raise serializers.ValidationError({"doctor": "Doctor profile not found for this technician."})

        validated_data['patient'] = patient
        validated_data['doctor'] = doctor

        instance = super().create(validated_data)
        self.generate_pdf(instance)
        return instance

    def update(self, instance, validated_data):
        validated_data.pop('patient_unique_id', None)
        technician_id = validated_data.pop('technician_id', None)

        if technician_id:
            doctor = self.get_doctor_from_technician(technician_id)
            if not doctor:
                raise serializers.ValidationError({"doctor": "Doctor profile not found for this technician."})
            validated_data['doctor'] = doctor

        instance = super().update(instance, validated_data)
        self.generate_pdf(instance)
        return instance

    def generate_pdf(self, consultation):
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=50, bottomMargin=50)
        elements = []
        styles = getSampleStyleSheet()
        bold_style = ParagraphStyle(name='Bold', parent=styles['Normal'], fontName='Helvetica-Bold')

        elements.append(Paragraph("Doctor Consultation Report", styles['Title']))
        elements.append(Spacer(1, 12))

        patient = consultation.patient
        report_time = consultation.created_at.strftime("%d/%m/%Y, %H:%M") if consultation.created_at else "N/A"
        test_date = getattr(patient, "test_date", None)
        formatted_test_date = test_date.strftime("%d/%m/%y") if test_date else "N/A"

        patient_info_data = [
            ['Patient Name:', patient.patient_name, 'XRAi ID:', patient.unique_patient_id],
            ['Patient Age:', str(patient.age), 'Patient ID:', patient.patient_excel_id or "N/A"],
            ['Gender:', patient.gender, 'Report Date/Time:', report_time],
            ['Test Date:', formatted_test_date, 'Referral Dr:', consultation.doctor.name if consultation.doctor else 'N/A'],
        ]

        info_table = Table(patient_info_data, colWidths=[100, 170, 100, 170])
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

        # Consultation Details
        fields = [
            ("Chief Complaint", consultation.chief_complaint),
            ("Diagnostic Tests", consultation.diagnostic_tests),
            ("Existing Medical", consultation.medical_conditions),
            ("Advice", consultation.advice),
            ("Medications", consultation.medications),
            ("Medical Fitness", consultation.fitness_status),
            ("Family/Own History", consultation.history),
            ("Allergies", consultation.allergies),
            
        ]

        valid_fields = [(label, str(value)) for label, value in fields if value not in [None, '']]
        paired_fields = []
        for i in range(0, len(valid_fields), 2):
            left = valid_fields[i]
            right = valid_fields[i + 1] if i + 1 < len(valid_fields) else ("", "")
            paired_fields.append([
                Paragraph(f"<b>{left[0]}</b>", styles['Normal']), left[1],
                Paragraph(f"<b>{right[0]}</b>", styles['Normal']), right[1]
            ])

        consult_table = Table(paired_fields, colWidths=[100, 180, 100, 180])
        consult_table.setStyle(TableStyle([
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(Paragraph("Consultation Details", styles['Heading2']))
        elements.append(consult_table)
        elements.append(Spacer(1, 30))

        # Doctor Section
        if consultation.doctor:
            doctor = consultation.doctor

            if doctor.signature and hasattr(doctor.signature, "path") and os.path.exists(doctor.signature.path):
                try:
                    img = Image(doctor.signature.path, width=150, height=50)
                    img.hAlign = 'LEFT'
                    elements.append(img)
                except Exception:
                    elements.append(Paragraph("Signature could not be loaded.", styles['Italic']))
            else:
                elements.append(Paragraph("Signature not available", styles['Normal']))

            elements.append(Spacer(1, 12))
            elements.append(Paragraph(f"<b>Doctor Name:</b> {doctor.name}", styles['Normal']))

            if doctor.designation:
                for line in doctor.designation.replace("<br>", "\n").split("\n"):
                    elements.append(Paragraph(line.strip(), styles['Normal']))
        else:
            elements.append(Paragraph("Doctor details not available", styles['Normal']))

        doc.build(elements)
        buffer.seek(0)
        consultation.pdf_report.save(
            f"consultation_{consultation.patient.unique_patient_id}.pdf",
            ContentFile(buffer.read()),
            save=True
        )
