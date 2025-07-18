from django.db import models
from camp_manager.Models.Patientdata import PatientData
from technician.Models.dentist import Dentist

class DentalConsultation(models.Model):
    patient = models.OneToOneField(PatientData, on_delete=models.CASCADE, related_name='dental_consultation')  # ✅ Now uses PatientData
    dentist = models.ForeignKey(Dentist, on_delete=models.SET_NULL, null=True, blank=True)  # ✅ Assuming Dentist model exists
    screening_date = models.DateField(null=True, blank=True)

    # === Family History ===
    family_diabetes = models.CharField(max_length=3, default='no')
    family_diabetes_years = models.IntegerField(null=True, blank=True)
    family_diabetes_relation = models.CharField(max_length=100, blank=True)
    family_hypertension = models.CharField(max_length=3, default='no')
    family_hypertension_years = models.IntegerField(null=True, blank=True)
    family_hypertension_relation = models.CharField(max_length=100, blank=True)
    family_other = models.TextField(blank=True)

    # === Medical History ===
    medical_diabetes = models.CharField(max_length=3, default='no')
    medical_diabetes_years = models.IntegerField(null=True, blank=True)
    medical_hypertension = models.CharField(max_length=3, default='no')
    medical_hypertension_years = models.IntegerField(null=True, blank=True)
    current_medications = models.CharField(max_length=3, default='no')
    medications_list = models.TextField(blank=True)
    past_surgeries = models.TextField(blank=True)

    # === Pain and Sensitivity ===
    pain_teeth = models.BooleanField(default=False)
    pain_teeth_numbers = models.CharField(max_length=200, blank=True)
    pain_regions = models.JSONField(default=dict)
    pain_days = models.IntegerField(null=True, blank=True)

    sensitivity = models.BooleanField(default=False)
    sensitivity_cold = models.BooleanField(default=False)
    sensitivity_hot = models.BooleanField(default=False)
    sensitivity_sweet = models.BooleanField(default=False)
    sensitivity_sour = models.BooleanField(default=False)
    sensitivity_regions = models.JSONField(default=dict)

    # === Gum and Caries ===
    bleeding_gums = models.BooleanField(default=False)
    other_complaints = models.TextField(blank=True)

    dental_caries = models.BooleanField(default=False)
    grossly_carious = models.CharField(max_length=200, blank=True)
    pit_fissure_caries = models.CharField(max_length=200, blank=True)
    other_caries = models.TextField(blank=True)

    # === Gingiva & Missing Teeth ===
    gingiva = models.BooleanField(default=False)
    gingiva_condition = models.CharField(max_length=20, blank=True)

    missing_teeth = models.BooleanField(default=False)
    missing_teeth_numbers = models.CharField(max_length=200, blank=True)

    # === Occlusion ===
    occlusion = models.BooleanField(default=False)
    occlusion_type = models.CharField(max_length=20, blank=True)
    malocclusion_type = models.CharField(max_length=20, blank=True)
    malocclusion_details = models.JSONField(default=dict)

    # === Other Findings & Advice ===
    other_findings = models.TextField(blank=True)

    restoration_required = models.BooleanField(default=False)
    restoration_teeth = models.CharField(max_length=200, blank=True)

    rct_required = models.BooleanField(default=False)
    rct_teeth = models.CharField(max_length=200, blank=True)

    iopa_required = models.BooleanField(default=False)
    iopa_teeth = models.CharField(max_length=200, blank=True)

    oral_prophylaxis_required = models.BooleanField(default=False)
    medications = models.TextField(blank=True)

    replacement_required = models.BooleanField(default=False)
    other_advice = models.TextField(blank=True)

    # === Saved Report and PDF ===
    saved_report = models.JSONField(default=dict, blank=True)
    report_saved_at = models.DateTimeField(null=True, blank=True)

    pdf_report = models.FileField(upload_to='dental_reports/', null=True, blank=True)  # ✅ Simple version
    pdf_filename = models.CharField(max_length=255, null=True, blank=True)
    pdf_saved_at = models.DateTimeField(null=True, blank=True)

    # === Meta ===
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # === Patient Proxy Properties ===
    @property
    def patient_name(self):
        return self.patient.patient_name if self.patient else ''

    @property
    def patient_id(self):
        return self.patient.patient_id if self.patient else ''

    @property
    def age(self):
        return self.patient.age if self.patient else None

    @property
    def gender(self):
        return self.patient.gender if self.patient else ''

    def __str__(self):
        return f"{self.patient.patient_name if self.patient else 'No Patient'} - Dental"
