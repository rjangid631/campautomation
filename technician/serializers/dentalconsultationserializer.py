from rest_framework import serializers
from io import BytesIO
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet
from django.core.files.base import ContentFile
from technician.Models.dentalconsultation import DentalConsultation
from camp_manager.Models.Patientdata import PatientData
import os

class DentalConsultationSerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)
    technician_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = DentalConsultation
        fields = '__all__'
        read_only_fields = ['pdf_report', 'pdf_filename', 'pdf_saved_at', 'patient']

    def get_dentist_from_technician(self, technician_id):
        from technician.Models.dentist import Dentist
        try:
            return Dentist.objects.get(technician_id=technician_id)
        except Dentist.DoesNotExist:
            return None

    def create(self, validated_data):
        unique_id = validated_data.pop('patient_unique_id')
        technician_id = validated_data.pop('technician_id', None)

        try:
            patient = PatientData.objects.get(unique_patient_id=unique_id)
        except PatientData.DoesNotExist:
            raise serializers.ValidationError({"patient_unique_id": "Invalid or not found."})

        validated_data['patient'] = patient
        dentist = self.get_dentist_from_technician(technician_id) if technician_id else None

        existing = DentalConsultation.objects.filter(patient=patient).first()
        if existing:
            # 🔁 Only reassign if dentist is not same as current one
            if dentist and (not existing.dentist or existing.dentist.technician_id != technician_id):
                print(f"🔁 Re-assigning dentist to technician {technician_id}")
                existing.dentist = dentist

            for attr, value in validated_data.items():
                setattr(existing, attr, value)

            existing.save()
            self.generate_pdf(existing)
            return existing

        if dentist:
            validated_data['dentist'] = dentist

        instance = super().create(validated_data)
        self.generate_pdf(instance)
        return instance

    

    def update(self, instance, validated_data):
        validated_data.pop('patient_unique_id', None)
        validated_data.pop('technician_id', None)
        instance = super().update(instance, validated_data)
        self.generate_pdf(instance)
        return instance
    
    def generate_pdf(self, consultation):
        print("📦 Starting PDF generation...")
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=20)
        styles = getSampleStyleSheet()
        story = []

        # Title
        story.append(Paragraph("Dental Prescription Report", styles['Title']))
        story.append(Spacer(1, 12))

        patient = consultation.patient
        test_date = consultation.screening_date.strftime("%d/%m/%Y") if consultation.screening_date else "N/A"
        report_time = consultation.created_at.strftime("%d/%m/%Y, %H:%M") if consultation.created_at else "N/A"

        data = [
            ["Patient Name:", patient.patient_name, "XRai ID:", patient.unique_patient_id],
            ["Patient Age:", str(patient.age), "Patient ID:", patient.patient_excel_id or "N/A"],
            ["Gender:", patient.gender, "Report Date/Time:", report_time],
            ["Test Date:", test_date, "Referral Dr:", "N/A"],
        ]

        table = Table(data, colWidths=[70, 140, 70, 140])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(table)
        story.append(Spacer(1, 20))

        # === FAMILY HISTORY ===
        story.append(Paragraph("<b>Family History:</b>", styles["Heading4"]))
        story.append(Paragraph(f"Diabetes: {consultation.family_diabetes} ({consultation.family_diabetes_years or 'N/A'} years, {consultation.family_diabetes_relation or 'N/A'})", styles["Normal"]))
        story.append(Paragraph(f"Hypertension: {consultation.family_hypertension} ({consultation.family_hypertension_years or 'N/A'} years, {consultation.family_hypertension_relation or 'N/A'})", styles["Normal"]))
        if consultation.family_other:
            story.append(Paragraph(f"Other: {consultation.family_other}", styles["Normal"]))
        story.append(Spacer(1, 12))

        # === MEDICAL HISTORY ===
        story.append(Paragraph("<b>Medical History:</b>", styles["Heading4"]))
        story.append(Paragraph(f"Diabetes: {consultation.medical_diabetes} ({consultation.medical_diabetes_years or 'N/A'} years)", styles["Normal"]))
        story.append(Paragraph(f"Hypertension: {consultation.medical_hypertension} ({consultation.medical_hypertension_years or 'N/A'} years)", styles["Normal"]))
        story.append(Paragraph(f"Current Medications: {consultation.current_medications}", styles["Normal"]))
        if consultation.medications_list:
            story.append(Paragraph(f"Medications List: {consultation.medications_list}", styles["Normal"]))
        if consultation.past_surgeries:
            story.append(Paragraph(f"Past Surgeries: {consultation.past_surgeries}", styles["Normal"]))
        story.append(Spacer(1, 12))

        # === PAIN DETAILS ===
        story.append(Paragraph("<b>Pain:</b>", styles["Heading4"]))
        story.append(Paragraph(f"Pain in teeth: {'Yes' if consultation.pain_teeth else 'No'}", styles["Normal"]))
        story.append(Paragraph(f"Pain Days: {consultation.pain_days or 'N/A'}", styles["Normal"]))
        story.append(Paragraph(f"Pain Regions: {', '.join(consultation.pain_regions) if consultation.pain_regions else 'N/A'}", styles["Normal"]))
        story.append(Paragraph(f"Pain Teeth Numbers: {consultation.pain_teeth_numbers or 'N/A'}", styles["Normal"]))
        story.append(Spacer(1, 12))

        # === SENSITIVITY ===
        story.append(Paragraph("<b>Sensitivity:</b>", styles["Heading4"]))
        story.append(Paragraph(f"Cold: {'Yes' if consultation.sensitivity_cold else 'No'}", styles["Normal"]))
        story.append(Paragraph(f"Hot: {'Yes' if consultation.sensitivity_hot else 'No'}", styles["Normal"]))
        story.append(Paragraph(f"Sweet: {'Yes' if consultation.sensitivity_sweet else 'No'}", styles["Normal"]))
        story.append(Paragraph(f"Sour: {'Yes' if consultation.sensitivity_sour else 'No'}", styles["Normal"]))
        story.append(Paragraph(f"Sensitivity Regions: {', '.join(consultation.sensitivity_regions) if consultation.sensitivity_regions else 'N/A'}", styles["Normal"]))
        story.append(Spacer(1, 12))

        # === COMPLAINTS & FINDINGS ===
        story.append(Paragraph("<b>Complaints:</b>", styles["Heading4"]))
        story.append(Paragraph(consultation.other_complaints or "No complaint provided", styles["Normal"]))
        story.append(Spacer(1, 8))

        story.append(Paragraph("<b>Oral Examination:</b>", styles["Heading4"]))
        story.append(Paragraph(consultation.other_findings or "No significant findings", styles["Normal"]))
        story.append(Spacer(1, 12))

        # === TREATMENT FLAGS ===
        story.append(Paragraph("<b>Treatment Suggestions:</b>", styles["Heading4"]))
        def flag(text, value): return f"{text}: {'Yes' if value else 'No'}"
        story.append(Paragraph(flag("Restoration Required", consultation.restoration_required), styles["Normal"]))
        story.append(Paragraph(flag("RCT Required", consultation.rct_required), styles["Normal"]))
        story.append(Paragraph(flag("IOPA Required", consultation.iopa_required), styles["Normal"]))
        story.append(Paragraph(flag("Oral Prophylaxis Required", consultation.oral_prophylaxis_required), styles["Normal"]))
        story.append(Paragraph(flag("Replacement Required", consultation.replacement_required), styles["Normal"]))
        story.append(Spacer(1, 12))

        # === PRESCRIPTION & ADVICE ===
        story.append(Paragraph("<b>Rx:</b>", styles["Heading4"]))
        if consultation.medications:
            for line in consultation.medications.splitlines():
                story.append(Paragraph(f"• {line}", styles['Normal']))
        else:
            story.append(Paragraph("• No medications", styles["Normal"]))
        story.append(Spacer(1, 8))

        story.append(Paragraph("<b>Advice:</b>", styles["Heading4"]))
        if consultation.other_advice:
            for line in consultation.other_advice.splitlines():
                story.append(Paragraph(f"• {line}", styles["Normal"]))
        else:
            story.append(Paragraph("• No specific advice", styles["Normal"]))
        story.append(Spacer(1, 20))

        # === Signature Block ===
        story.append(Spacer(1, 12))
        story.append(Paragraph("<b>Verified by:</b>", styles['Heading4']))
        dentist = consultation.dentist
        print("🧾 Dentist in PDF:", dentist)

        if dentist and dentist.signature and hasattr(dentist.signature, 'path'):
            if os.path.exists(dentist.signature.path):
                try:
                    img = Image(dentist.signature.path, width=120, height=40)
                    img.hAlign = 'LEFT'
                    story.append(img)
                    print("🖋️ Dentist signature added.")
                except Exception as e:
                    print(f"⚠️ Error loading signature: {e}")
                    story.append(Paragraph("Signature could not be loaded.", styles['Italic']))
            else:
                story.append(Paragraph("Signature file missing", styles["Normal"]))
        else:
            story.append(Paragraph("Dentist: N/A", styles['Normal']))

        # Dentist name and designation
        if dentist:
            story.append(Spacer(1, 8))
            story.append(Paragraph(f"<b>{dentist.name}</b>", styles['Normal']))
            story.append(Paragraph(dentist.designation or "Dental Surgeon", styles['Normal']))

        doc.build(story)
        buffer.seek(0)
        filename = f"dental_{consultation.patient.unique_patient_id}.pdf"
        consultation.pdf_report.save(filename, ContentFile(buffer.read()), save=True)
        print(f"✅ PDF saved as {filename}")