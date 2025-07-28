from django.contrib import admin
from django.utils.html import format_html

from technician.Models.audiometrist import Audiometrist
from technician.Models.audiometry import Audiometry
from technician.Models.dentist import Dentist
from technician.Models.doctorconsultation import DoctorConsultation
from technician.Models.doctors import Doctor
from technician.Models.optometrists import Optometrist
from technician.Models.pathology import Pathology
from technician.Models.technician import Technician
from technician.Models.servicestatus import ServiceStatus
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from technician.Models.optometry import Optometry
from technician.Models.vitals import Vitals
from technician.Models.dentalconsultation import DentalConsultation  # ✅ Import dental model


# === Technician Service Assignment ===
@admin.register(TechnicianServiceAssignment)
class TechnicianServiceAssignmentAdmin(admin.ModelAdmin):
    list_display = ('technician', 'service', 'camp')
    search_fields = ('technician__name', 'service__name', 'camp__location')
    list_filter = ('camp', 'service')


# === Technician ===
@admin.register(Technician)
class TechnicianAdmin(admin.ModelAdmin):
    list_display = ['get_email', 'get_name', 'get_contact', 'get_is_active', 'get_is_staff']
    search_fields = ['user__email', 'user__name', 'user__contact_number']

    def get_email(self, obj):
        return obj.user.email if obj.user else "No user assigned"
    get_email.short_description = 'Email'

    def get_name(self, obj):
        return obj.user.name if obj.user else "No user assigned"
    get_name.short_description = 'Name'

    def get_contact(self, obj):
        return obj.user.contact_number if obj.user else "—"
    get_contact.short_description = 'Contact Number'

    def get_is_active(self, obj):
        return obj.user.is_active if obj.user else False
    get_is_active.boolean = True
    get_is_active.short_description = 'Is Active'

    def get_is_staff(self, obj):
        return obj.user.is_staff if obj.user else False
    get_is_staff.boolean = True
    get_is_staff.short_description = 'Is Staff'



admin.site.register(ServiceStatus)


# === Audiometry ===
@admin.register(Audiometry)
class AudiometryAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'patient', 'age', 'gender',
        'left_ear_finding', 'right_ear_finding',
        'pdf_report_link',
    )
    search_fields = ('patient__patient_name',)
    list_filter = ('left_ear_finding', 'right_ear_finding', 'patient__gender')

    def pdf_report_link(self, obj):
        if obj.pdf_report:
            return format_html("<a href='{}' target='_blank'>Download</a>", obj.pdf_report.url)
        return "No report"
    pdf_report_link.short_description = "PDF Report"


# === Optometry ===
@admin.register(Optometry)
class OptometryAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'patient', 'age', 'gender',
        'far_vision_right', 'far_vision_left',
        'near_vision_right', 'near_vision_left',
        'pdf_report_link',
    )
    search_fields = ('patient__patient_name',)
    list_filter = ('patient__gender',)

    def pdf_report_link(self, obj):
        if obj.pdf_report:
            return format_html("<a href='{}' target='_blank'>Download</a>", obj.pdf_report.url)
        return "No report"
    pdf_report_link.short_description = "PDF Report"


# === Vitals ===
@admin.register(Vitals)
class VitalsAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'patient', 'age', 'gender',
        'height', 'weight', 'bp', 'pulse',
        'pdf_report_link',
    )
    search_fields = ('patient__patient_name', 'patient__unique_patient_id')
    list_filter = ('patient__gender',)

    def pdf_report_link(self, obj):
        if obj.pdf_report:
            return format_html("<a href='{}' target='_blank'>Download</a>", obj.pdf_report.url)
        return "No report"
    pdf_report_link.short_description = "PDF Report"


# === Doctor Consultation ===
@admin.register(DoctorConsultation)
class DoctorConsultationAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'patient', 'doctor', 'fitness_status',
        'created_at', 'pdf_report_link',
    )
    search_fields = ('patient__patient_name', 'patient__unique_patient_id', 'doctor__name')
    list_filter = ('fitness_status', 'patient__gender', 'doctor')

    def pdf_report_link(self, obj):
        if obj.pdf_report:
            return format_html("<a href='{}' target='_blank'>Download</a>", obj.pdf_report.url)
        return "No report available"
    pdf_report_link.short_description = "PDF Report"


# === Dental Consultation ===
@admin.register(DentalConsultation)
class DentalConsultationAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'patient', 'screening_date', 'pdf_report_link'
    )
    search_fields = ('patient__patient_name', 'patient__unique_patient_id')
    list_filter = ('patient__gender',)

    def pdf_report_link(self, obj):
        if obj.pdf_report:
            return format_html("<a href='{}' target='_blank'>Download</a>", obj.pdf_report.url)
        return "No report"
    pdf_report_link.short_description = "PDF Report"


# === Doctors ===
@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'designation', 'user')


# === Optometrists ===
@admin.register(Optometrist)
class OptometristAdmin(admin.ModelAdmin):
    list_display = ['name', 'designation', 'user']

# === Dentists ===
@admin.register(Dentist)
class DentistAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'designation', 'technician', 'user')
    search_fields = ('name', 'designation', 'technician__name', 'user__email')
    list_filter = ('designation',)

@admin.register(Audiometrist)
class AudiometristAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'designation', 'technician', 'user')
    search_fields = ('name', 'designation', 'technician__user__name', 'user__email')
    list_filter = ('designation',)

@admin.register(Pathology)
class PathologyAdmin(admin.ModelAdmin):
    list_display = (
        'id', 'patient', 'get_age', 'get_gender',
        'height', 'weight', 'bp', 'pulse',
        'rbc', 'hb', 'lipid', 'random_blood_sugar', 'creatinine',
        'egfr', 'total_bilirubin',
    )
    search_fields = ('patient__patient_name', 'patient__unique_patient_id')
    list_filter = ('patient__gender',)

    def get_age(self, obj):
        return obj.patient.age
    get_age.short_description = 'Age'

    def get_gender(self, obj):
        return obj.patient.gender
    get_gender.short_description = 'Gender'