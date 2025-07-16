from django.db import models
from camp_manager.Models.Patientdata import PatientData
from technician.Models.optometrists import Optometrist

class Optometry(models.Model):
    patient = models.OneToOneField(PatientData, on_delete=models.CASCADE, related_name='patient_optometry')
    optometrist = models.ForeignKey(Optometrist, on_delete=models.SET_NULL, null=True, blank=True, related_name="optometry_reports")

    # === Vision fields ===
    far_vision_right = models.CharField(max_length=100, null=True, blank=True)
    far_vision_left = models.CharField(max_length=100, null=True, blank=True)
    near_vision_right = models.CharField(max_length=100, null=True, blank=True)
    near_vision_left = models.CharField(max_length=100, null=True, blank=True)

    # === Refraction (Right Eye) ===
    spherical_right = models.CharField(max_length=20, null=True, blank=True)
    cylindrical_right = models.CharField(max_length=20, null=True, blank=True)
    axis_right = models.CharField(max_length=10, null=True, blank=True)
    add_right = models.CharField(max_length=10, null=True, blank=True)

    # === Refraction (Left Eye) ===
    spherical_left = models.CharField(max_length=20, null=True, blank=True)
    cylindrical_left = models.CharField(max_length=20, null=True, blank=True)
    axis_left = models.CharField(max_length=10, null=True, blank=True)
    add_left = models.CharField(max_length=10, null=True, blank=True)

    # === Colour Vision Test ===
    color_vision_normal = models.BooleanField(default=False)
    color_vision_other = models.CharField(max_length=255, null=True, blank=True)
    color_vision_remark = models.TextField(null=True, blank=True)

    # === Meta ===
    pdf_report = models.FileField(upload_to='optometry_reports/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # === Patient Proxy Fields ===
    @property
    def patient_name(self):
        return self.patient.patient_name

    @property
    def patient_id(self):
        return self.patient.patient_id

    @property
    def age(self):
        return self.patient.age

    @property
    def gender(self):
        return self.patient.gender

    def __str__(self):
        return f"{self.patient.patient_name} - Optometry"
