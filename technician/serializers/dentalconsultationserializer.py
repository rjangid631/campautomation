from io import BytesIO
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
)
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from django.core.files.base import ContentFile
from rest_framework import serializers

from technician.Models.dentalconsultation import DentalConsultation
from camp_manager.Models.Patientdata import PatientData

class DentalConsultationSerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)

    class Meta:
        model = DentalConsultation
        fields = '__all__'
        read_only_fields = ['pdf_report', 'pdf_filename', 'pdf_saved_at', 'patient']
        extra_kwargs = {
            'patient': {'read_only': True}
        }

    def create(self, validated_data):
        request = self.context.get('request')
        unique_id = validated_data.pop('patient_unique_id')

        print("📝 Starting DentalConsultationSerializer.create()")
        print(f"🔍 Received unique_id: {unique_id}")

        try:
            patient = PatientData.objects.get(unique_patient_id=unique_id)
            print(f"✅ Patient found: {patient.patient_name} (Excel ID: {patient.patient_excel_id})")
        except PatientData.DoesNotExist:
            print("❌ Patient not found with the given unique_patient_id")
            raise serializers.ValidationError({"patient_unique_id": "Invalid or not found."})

        validated_data['patient'] = patient

        # ✅ Auto-assign dentist from technician
        if request:
            print(f"🔐 Logged-in user: {request.user} (ID: {request.user.id})")
            if hasattr(request.user, 'technician'):
                technician = request.user.technician
                print(f"👨‍🔧 Technician found: {technician.name} (ID: {technician.id})")
                if hasattr(technician, 'dentist_profile'):
                    print(f"🦷 Dentist linked: {technician.dentist_profile.name}")
                    validated_data['dentist'] = technician.dentist_profile
                else:
                    print("⚠️ Technician has no linked dentist_profile")
                    raise serializers.ValidationError({"dentist": "Dentist profile not linked to this technician."})
            else:
                print("❌ User is not linked to a technician")
                raise serializers.ValidationError({"technician": "User is not a technician."})
        else:
            print("❌ Request object not available in context")
            raise serializers.ValidationError({"error": "Request context is missing"})

        # Update if consultation already exists
        existing = DentalConsultation.objects.filter(patient=patient).first()
        if existing:
            print("♻️ Existing consultation found. Updating it.")
            for attr, value in validated_data.items():
                setattr(existing, attr, value)
            existing.save()
            self.generate_pdf(existing)
            print("✅ Updated existing consultation and generated PDF.")
            return existing

        instance = super().create(validated_data)
        self.generate_pdf(instance)
        print("✅ Created new consultation and generated PDF.")
        return instance


    def update(self, instance, validated_data):
        validated_data.pop('patient_unique_id', None)
        instance = super().update(instance, validated_data)
        self.generate_pdf(instance)
        return instance

    def generate_pdf(self, consultation):
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=30 * mm,
            rightMargin=30 * mm,
            topMargin=30 * mm,
            bottomMargin=20 * mm
        )
        styles = getSampleStyleSheet()
        story = []

        # === Title ===
        title_style = styles['Heading1']
        title_style.fontSize = 14
        title_style.alignment = TA_LEFT
        story.append(Paragraph("Dental Prescription Report", title_style))
        story.append(Spacer(1, 12))

        # === Patient Info Table ===
        data = [
            ["Patient Name:", consultation.patient.patient_name, "XRai ID:", consultation.patient.unique_patient_id],
            ["Patient Age:", str(consultation.patient.age), "Patient ID:", consultation.patient.patient_excel_id],
            ["Gender:", consultation.patient.gender, "Report Date/Time:",
             consultation.created_at.strftime("%d/%m/%y, %H:%M") if consultation.created_at else "N/A"],
            ["Test Date:", consultation.screening_date.strftime("%d/%m/%y") if consultation.screening_date else "N/A", "Referral Dr:", ""],
        ]
        table = Table(data, colWidths=[40 * mm, 55 * mm, 40 * mm, 55 * mm])
        table.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 1, colors.black),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.black),
            ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))
        story.append(table)
        story.append(Spacer(1, 20))

        # === Complaints Section ===
        story.append(Paragraph("<b>Complaint:</b>", styles["Heading4"]))
        if consultation.other_complaints:
            for line in consultation.other_complaints.split('\n'):
                story.append(Paragraph(f"• {line}", styles["Normal"]))
        else:
            story.append(Paragraph("• No complaint provided", styles["Normal"]))
        story.append(Spacer(1, 12))

        story.append(Paragraph("• PERSONAL HISTORY: N/A", styles["Normal"]))
        story.append(Paragraph("• FAMILY HISTORY: N/A", styles["Normal"]))
        story.append(Spacer(1, 12))

        # === Oral Examination ===
        story.append(Paragraph("<b>Oral Examination:</b>", styles["Heading4"]))
        if consultation.other_findings:
            for line in consultation.other_findings.split('\n'):
                story.append(Paragraph(f"{line}", styles["Normal"]))
        else:
            story.append(Paragraph("No significant findings", styles["Normal"]))
        story.append(Spacer(1, 12))

        # === Prescription ===
        story.append(Paragraph("<b>Rx:</b>", styles["Heading4"]))
        meds = consultation.medications.split('\n') if consultation.medications else []
        for med in meds or ["", "", "", ""]:
            story.append(Paragraph(f"• {med.strip()}", styles["Normal"]))
        story.append(Spacer(1, 12))

        # === Advice ===
        story.append(Paragraph("<b>Advice:</b>", styles["Heading4"]))
        if consultation.other_advice:
            for line in consultation.other_advice.split('\n'):
                story.append(Paragraph(f"• {line}", styles["Normal"]))
        else:
            story.append(Paragraph("• No specific advice", styles["Normal"]))
        story.append(Spacer(1, 20))

        # === Dentist Info and Signature ===
        if consultation.dentist:
            story.append(Paragraph(f"<b>{consultation.dentist.name}</b>", styles["Normal"]))
            story.append(Paragraph(consultation.dentist.designation or "Dental Surgeon", styles["Normal"]))
            story.append(Spacer(1, 10))

            if consultation.dentist.signature and consultation.dentist.signature.path:
                try:
                    img = Image(consultation.dentist.signature.path, width=100, height=30)
                    story.append(img)
                except Exception as e:
                    story.append(Paragraph("<i>Signature could not be loaded.</i>", styles["Normal"]))
            else:
                story.append(Spacer(1, 15))
                story.append(Paragraph("________________________", styles["Normal"]))
        else:
            story.append(Paragraph("<b>Dr. Name</b>", styles["Normal"]))
            story.append(Paragraph("Dental Surgeon", styles["Normal"]))
            story.append(Spacer(1, 15))
            story.append(Paragraph("________________________", styles["Normal"]))

        story.append(Paragraph("Signature", styles["Normal"]))

        # === Build PDF ===
        doc.build(story)
        buffer.seek(0)

        consultation.pdf_report.save(
            f"dental_{consultation.patient.unique_patient_id}.pdf",
            ContentFile(buffer.read()),
            save=True
        )
