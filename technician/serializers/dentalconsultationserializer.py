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
from reportlab.lib.styles import ParagraphStyle


class DentalConsultationSerializer(serializers.ModelSerializer):
    patient_unique_id = serializers.CharField(write_only=True)
    technician_id = serializers.IntegerField(write_only=True, required=False)
    family_diabetes_years = serializers.CharField(required=False, allow_blank=True)
    family_hypertension_years = serializers.CharField(required=False, allow_blank=True)
    medical_diabetes_years = serializers.CharField(required=False, allow_blank=True)
    medical_hypertension_years = serializers.CharField(required=False, allow_blank=True)
    pain_days = serializers.CharField(required=False, allow_blank=True)

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
    def validate(self, data):
        integer_fields = [
            'family_diabetes_years',
            'family_hypertension_years',
            'medical_diabetes_years',
            'medical_hypertension_years',
            'pain_days',
        ]
        for field in integer_fields:
            val = data.get(field)
            if val in [None, '']:
                data[field] = None
            else:
                try:
                    data[field] = int(val)
                except ValueError:
                    raise serializers.ValidationError({field: "Must be a valid number or left blank."})
        return data    

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

        # Custom styles
        custom_style = ParagraphStyle(
            'CustomNormal',
            parent=styles['Normal'],
            fontSize=9,
            leading=11,
            spaceBefore=2,
            spaceAfter=2
        )
        
        section_style = ParagraphStyle(
            'SectionTitle',
            parent=styles['Heading4'],
            fontSize=10,
            leading=12,
            spaceBefore=8,
            spaceAfter=4,
            textColor=colors.black
        )
        
        # Complaint item style for better formatting
        complaint_style = ParagraphStyle(
            'ComplaintStyle',
            parent=styles['Normal'],
            fontSize=9,
            leading=10,
            spaceBefore=1,
            spaceAfter=1,
            leftIndent=12
        )

        # Title
        story.append(Paragraph("Dental Prescription Report", styles['Title']))
        story.append(Spacer(1, 12))

        # Patient Information Table
        patient = consultation.patient
        test_date = consultation.screening_date.strftime("%d/%m/%Y") if consultation.screening_date else "N/A"
        report_time = consultation.created_at.strftime("%d/%m/%Y, %H:%M") if consultation.created_at else "N/A"

        data = [
            ["Patient Name:", patient.patient_name, "XRai ID:", patient.unique_patient_id],
            ["Patient Age:", str(patient.age), "Patient ID:", patient.patient_excel_id or "N/A"],
            ["Gender:", patient.gender, "Report Date/Time:", report_time],
            ["Test Date:", test_date, "Referral Dr:", "N/A"],
        ]

        table = Table(data, colWidths=[100, 170, 100, 170])
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

        # Enhanced helper functions for building complaint sections
        def build_chief_complaint(dental):
            complaints = []
            counter = 1

            # Pain in teeth numbers
            if dental.pain_teeth_numbers:
                complaints.append(f"Patient complains of Pain in teeth numbers {dental.pain_teeth_numbers}")

            # Pain in regions
            region_text = ""
            if dental.pain_regions:
                regions = [region.replace('_', ' ') for region in dental.pain_regions]
                if len(regions) == 6:
                    region_text = "Pain in complete Mouth"
                elif len(regions) == 1:
                    region_text = f"Pain in {regions[0]} region"
                elif len(regions) == 2:
                    region_text = f"Pain in {regions[0]} & {regions[1]} region"
                else:
                    region_text = f"Pain in {', '.join(regions[:-1])} & {regions[-1]} region"

            if region_text:
                if dental.pain_days:
                    region_text += f" since {dental.pain_days} days"
                complaints.append(region_text)

            # Sensitivity block
            if dental.sensitivity:
                for sens_type in ['cold', 'hot', 'sweet', 'sour']:
                    if getattr(dental, f'sensitivity_{sens_type}'):
                        regions = []
                        if hasattr(dental, 'sensitivity_regions') and isinstance(dental.sensitivity_regions, dict):
                            regions = dental.sensitivity_regions.get(sens_type, [])

                        if regions:
                            # complaints.append(f"Sensitivity to {sens_type.capitalize()}:")
                            for region in regions:
                                region_formatted = region.replace('_', ' ')
                                complaints.append(f"{counter}. Sensitivity to {sens_type} in {region_formatted} region since")
                                counter += 1

            # Bleeding gums
            if dental.bleeding_gums:
                complaints.append("Bleeding gums")

            # Other complaints
            if dental.other_complaints:
                complaints.append(dental.other_complaints)
            else:
                complaints.append("Nothing")

            return '\n'.join(complaints)


        def build_examination_details(dental):
            findings = []
            
            if dental.dental_caries:
                if dental.grossly_carious:
                    findings.append(f"Grossly Carious in {dental.grossly_carious}")
                if dental.pit_fissure_caries:
                    findings.append(f"Pit w.r.t {dental.pit_fissure_caries}")
                if dental.other_caries:
                    findings.append(f"Any other Caries: {dental.other_caries}")
            
            if dental.gingiva_condition:
                condition = dental.gingiva_condition.lower()
                if condition == "normal":
                    findings.append("Gingiva with normal Limits.")
                elif condition == "mild":
                    findings.append("Mild inflammatory Gingivitis.")
                elif condition == "moderate":
                    findings.append("Moderate inflammatory Gingivitis.")
                elif condition == "severe":
                    findings.append("Severe inflammatory Gingivitis.")
            
            if dental.missing_teeth and dental.missing_teeth_numbers:
                findings.append(f"Teeth missing w.r.t {dental.missing_teeth_numbers}")
            
            if dental.occlusion:
                if dental.occlusion_type and dental.occlusion_type.lower() == "normal":
                    findings.append("Occlusion: Normal")
                elif dental.occlusion_type and dental.occlusion_type.lower() == "malocclusion":
                    malocclusion_details = dental.malocclusion_details or {}

                    # Handle Crowding
                    crowding = malocclusion_details.get('crowding', [])
                    if crowding:
                        if len(crowding) == 1:
                            findings.append(f"Crowding with respect to {crowding[0]} teeth")
                        elif len(crowding) == 2:
                            findings.append(f"Crowding with respect to {crowding[0]} and {crowding[1]} teeth")
                        elif len(crowding) == 3:
                            findings.append("Crowding with respect to upper teeth, lower teeth, and anterior teeth")

                    # Handle Spacing
                    spacing = malocclusion_details.get('spacing', [])
                    if spacing:
                        if len(spacing) == 1:
                            findings.append(f"Spacing with respect to {spacing[0]}")
                        elif len(spacing) == 2:
                            findings.append(f"Spacing with respect to {spacing[0]} and {spacing[1]}")
                        elif len(spacing) == 3:
                            findings.append("Spacing with respect to upper teeth, lower teeth, and anterior teeth")

                    # Handle Protrusion
                    protrusion = malocclusion_details.get('protrusion', [])
                    if protrusion:
                        names = {
                            "maxillary": "maxillary teeth",
                            "mandibular": "mandibular teeth",
                            "bimaxillary": "bimaxillary teeth"
                        }
                        label = "Protrusion"
                        regions = [names[p] for p in protrusion if p in names]
                        if len(regions) == 1:
                            findings.append(f"{label} w.r.t {regions[0]}")
                        elif len(regions) == 2:
                            findings.append(f"{label} w.r.t {regions[0]} & {regions[1]}")
                        elif len(regions) == 3:
                            findings.append(f"{label} w.r.t {regions[0]}, {regions[1]}, and {regions[2]}")
            
            if dental.other_findings:
                findings.append(f"Other findings: {dental.other_findings}")
            
            return '\n'.join(findings) if findings else "No significant findings"

        def build_advice_list(dental):
            advice = []
            
            if dental.restoration_required and dental.restoration_teeth:
                advice.append(f"Restoration w.r.t {dental.restoration_teeth}")
            
            if dental.rct_required and dental.rct_teeth:
                advice.append(f"RCT (Root Canal Treatment) w.r.t {dental.rct_teeth}")
            
            if dental.iopa_required and dental.iopa_teeth:
                advice.append(f"IOPA w.r.t {dental.iopa_teeth}")
            
            if dental.oral_prophylaxis_required:
                advice.append("Oral Prophylaxis")
            
            if dental.replacement_required:
                advice.append("Replacement of missing teeth.")
            
            if dental.other_advice:
                advice.append(f"Other advice: {dental.other_advice}")
            
            return advice if advice else ["No specific advice"]

        # Complain Section
        # story.append(Paragraph("<b>Complain:</b>", section_style))
        
        # Chief Complaint with improved formatting
        chief_complaint = build_chief_complaint(consultation)
        # Split by lines and handle each line appropriately
        complaint_lines = chief_complaint.split('\n')
        
        # Add chief complaint header
        story.append(Paragraph("<b>• CHIEF COMPLAINT/S:</b>", complaint_style))
        
        for line in complaint_lines:
            if line.strip():
                if line.startswith('_'):
                    # Add a line separator
                    story.append(Spacer(1, 3))
                    line_para = Paragraph('_' * 40, complaint_style)
                    story.append(line_para)
                    story.append(Spacer(1, 3))
                elif line.startswith('Sensitivity to'):
                    # Sensitivity headers
                    story.append(Paragraph(f"<b>{line}</b>", complaint_style))
                elif line[0].isdigit() and '. ' in line:
                    # Numbered sensitivity items
                    story.append(Paragraph(f"  {line}", complaint_style))
                else:
                    # Regular complaint text
                    story.append(Paragraph(line, complaint_style))
        
        story.append(Spacer(1, 5))
        
        # Personal History
        personal_history_parts = []
        if consultation.medical_diabetes == 'yes':
            diabetes_text = 'History of diabetes'
            if consultation.medical_diabetes_years:
                diabetes_text += f' since {consultation.medical_diabetes_years} years'
            personal_history_parts.append(diabetes_text)
        
        if consultation.medical_hypertension == 'yes':
            hyper_text = 'History of Hypertension'
            if consultation.medical_hypertension_years:
                hyper_text += f' since {consultation.medical_hypertension_years} years'
            personal_history_parts.append(hyper_text)
        
        if consultation.current_medications == 'yes':
            med_text = 'Patient is on medications'
            if consultation.medications_list.lower() != 'no':
                med_text += f': {consultation.medications_list}'
            personal_history_parts.append(med_text)

        if consultation.past_surgeries:
            personal_history_parts.append(f'Past surgeries: {consultation.past_surgeries}')
        
        personal_history_text = '. '.join(personal_history_parts) + '.' if personal_history_parts else 'N/A'
        story.append(Paragraph(f"<b>• PERSONAL HISTORY:</b> {personal_history_text}", complaint_style))
        
        # Family History
        family_history_parts = []
        if consultation.family_diabetes == 'yes':
            diabetes_text = 'Family History of diabetes'
            if consultation.family_diabetes_relation:
                diabetes_text += f' in {consultation.family_diabetes_relation}'
            family_history_parts.append(diabetes_text)
        
        if consultation.family_hypertension == 'yes':
            hyper_text = 'Family History of Hypertension'
            if consultation.family_hypertension_relation:
                hyper_text += f' in {consultation.family_hypertension_relation}'
            family_history_parts.append(hyper_text)

        family_history_text = '. '.join(family_history_parts) + '.' if family_history_parts else 'N/A'
        story.append(Paragraph(f"<b>• FAMILY HISTORY:</b> {family_history_text}", complaint_style))
        story.append(Spacer(1, 8))

        # Oral Examination
        story.append(Paragraph("<b>Oral Examination:</b>", section_style))
        examination_details = build_examination_details(consultation)
        
        # Split examination details by lines for better formatting
        exam_lines = examination_details.split('\n')
        for line in exam_lines:
            if line.strip():
                story.append(Paragraph(line, custom_style))
        
        story.append(Spacer(1, 12))

        # Prescription (Rx) with proper symbol
        story.append(Paragraph("<b>R<sub>x</sub></b>", section_style))
        
        if consultation.medications:
            medications = [med.strip() for med in consultation.medications.split('\n') if med.strip()]
            for medication in medications:
                story.append(Paragraph(f"• {medication}", custom_style))
            # Fill remaining lines up to 4
            remaining_lines = 4 - len(medications)
            for i in range(remaining_lines):
                story.append(Paragraph("•", custom_style))
        else:
            # Show 4 empty bullet points
            for i in range(4):
                story.append(Paragraph("•", custom_style))
        story.append(Spacer(1, 8))

        # Advice
        story.append(Paragraph("<b>Advice:</b>", section_style))
        advice_list = build_advice_list(consultation)
        for advice_item in advice_list:
            story.append(Paragraph(f"• {advice_item}", custom_style))
        story.append(Spacer(1, 20))

        # Doctor Information and Signature
        dentist = consultation.dentist
        doctor_name = dentist.name if dentist else "Dr. Name"
        doctor_designation = dentist.designation if dentist and dentist.designation else "Dental Surgeon"
        
        story.append(Paragraph(f"<b>{doctor_name}</b>", custom_style))
        story.append(Paragraph(doctor_designation, custom_style))
        story.append(Spacer(1, 12))

        # Signature
        if dentist and dentist.signature and hasattr(dentist.signature, 'path'):
            if os.path.exists(dentist.signature.path):
                try:
                    img = Image(dentist.signature.path, width=120, height=40)
                    img.hAlign = 'LEFT'
                    story.append(img)
                    print("🖋️ Dentist signature added.")
                except Exception as e:
                    print(f"⚠️ Error loading signature: {e}")
                    story.append(Paragraph("_" * 30, custom_style))
                    story.append(Paragraph("Signature", custom_style))
            else:
                story.append(Paragraph("_" * 30, custom_style))
                story.append(Paragraph("Signature", custom_style))
        else:
            story.append(Paragraph("_" * 30, custom_style))
            story.append(Paragraph("Signature", custom_style))

        # Build PDF
        try:
            doc.build(story)
            buffer.seek(0)
            filename = f"dental_{consultation.patient.unique_patient_id}.pdf"
            consultation.pdf_report.save(filename, ContentFile(buffer.read()), save=True)
            print(f"✅ PDF saved as {filename}")
            return buffer
        except Exception as e:
            print(f"❌ Error building PDF: {e}")
            raise