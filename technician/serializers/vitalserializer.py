# technician/serializers/vitalsserializer.py

from rest_framework import serializers
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from django.core.files.base import ContentFile
from technician.Models.vitals import Vitals
from camp_manager.Models.Patientdata import PatientData

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
        patient_unique_id = validated_data.pop('patient_unique_id')
        try:
            patient = PatientData.objects.get(unique_patient_id=patient_unique_id)
        except PatientData.DoesNotExist:
            raise serializers.ValidationError({"patient_unique_id": "Invalid or not found."})

        validated_data['patient'] = patient
        vitals = super().create(validated_data)
        self.generate_pdf(vitals)
        return vitals

    def update(self, instance, validated_data):
        validated_data.pop('patient_unique_id', None)
        vitals = super().update(instance, validated_data)
        self.generate_pdf(vitals)
        return vitals

    def generate_pdf(self, vitals):
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Header Info
        p.setFont("Helvetica-Bold", 14)
        p.drawString(30*mm, height - 30*mm, "Vitals Report")

        # Patient Info
        p.setFont("Helvetica", 10)
        y = height - 50*mm
        p.drawString(30*mm, y, f"Patient Name: {vitals.patient.patient_name}")
        y -= 12
        p.drawString(30*mm, y, f"Unique ID: {vitals.patient.unique_patient_id}")
        y -= 12
        p.drawString(30*mm, y, f"Age: {vitals.age}")
        y -= 12
        p.drawString(30*mm, y, f"Gender: {vitals.gender}")
        y -= 12
        p.drawString(30*mm, y, f"Height: {vitals.height} cm")
        y -= 12
        p.drawString(30*mm, y, f"Weight: {vitals.weight} kg")
        y -= 12
        p.drawString(30*mm, y, f"Blood Pressure: {vitals.bp}")
        y -= 12
        p.drawString(30*mm, y, f"Pulse: {vitals.pulse} bpm")

        p.showPage()
        p.save()

        buffer.seek(0)
        vitals.pdf_report.save(
            f"vitals_{vitals.patient.unique_patient_id}.pdf",
            ContentFile(buffer.read()),
            save=True
        )
