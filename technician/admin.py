from django.contrib import admin
from technician.Models.audiometry import Audiometry
from technician.Models.doctorconsultation import DoctorConsultation
from technician.Models.doctors import Doctor
from technician.Models.optometrists import Optometrist
from technician.Models.technician import Technician
from technician.Models.servicestatus import ServiceStatus
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment
from django.contrib import admin
from django.utils.html import format_html
from technician.Models.optometry import Optometry 
from technician.Models.vitals import Vitals


@admin.register(TechnicianServiceAssignment)
class TechnicianServiceAssignmentAdmin(admin.ModelAdmin):
    list_display = ('technician', 'service', 'camp')
    search_fields = ('technician__name', 'service__name', 'camp__location')
    list_filter = ('camp', 'service')


class TechnicianAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'contact_number', 'is_active', 'is_staff']
    search_fields = ['email', 'name', 'contact_number']

    def save_model(self, request, obj, form, change):
        password = form.cleaned_data.get('password')
        if password and not password.startswith('pbkdf2_'):
            obj.set_password(password)
        super().save_model(request, obj, form, change)


@admin.register(Audiometry)
class AudiometryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'patient',
        'age',
        'gender',
        'left_ear_finding',
        'right_ear_finding',
        'pdf_report_link',
    )
    search_fields = ('patient__patient_name',)
    list_filter = ('left_ear_finding', 'right_ear_finding', 'patient__gender')

    def pdf_report_link(self, obj):
        if obj.pdf_report:
            return f"<a href='{obj.pdf_report.url}' target='_blank'>Download</a>"
        return "No report"
    pdf_report_link.allow_tags = True
    pdf_report_link.short_description = "PDF Report"

 # Adjust path if needed

@admin.register(Optometry)
class OptometryAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'patient',
        'age',
        'gender',
        'far_vision_right',
        'far_vision_left',
        'near_vision_right',
        'near_vision_left',
        'pdf_report_link',
    )
    search_fields = ('patient__patient_name',)
    list_filter = ('patient__gender',)

    def pdf_report_link(self, obj):
        if obj.pdf_report:
            return format_html("<a href='{}' target='_blank'>Download</a>", obj.pdf_report.url)
        return "No report"

    pdf_report_link.short_description = "PDF Report"

@admin.register(Vitals)
class VitalsAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'patient',
        'age',
        'gender',
        'height',
        'weight',
        'bp',
        'pulse',
        'pdf_report_link',
    )
    search_fields = ('patient__patient_name', 'patient__unique_patient_id')
    list_filter = ('patient__gender',)

    def pdf_report_link(self, obj):
        if obj.pdf_report:
            return format_html("<a href='{}' target='_blank'>Download</a>", obj.pdf_report.url)
        return "No report"

    pdf_report_link.short_description = "PDF Report"

@admin.register(DoctorConsultation)
class DoctorConsultationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'patient',
        'doctor',
        'fitness_status',
        'created_at',
        'pdf_report_link',
    )
    search_fields = ('patient__patient_name', 'patient__unique_patient_id', 'doctor__name')
    list_filter = ('fitness_status', 'patient__gender', 'doctor')

    def pdf_report_link(self, obj):
        if obj.pdf_report:
            return format_html("<a href='{}' target='_blank'>Download</a>", obj.pdf_report.url)
        return "No report available"

    pdf_report_link.short_description = "PDF Report"

@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'designation', 'user')


@admin.register(Optometrist)
class OptometristAdmin(admin.ModelAdmin):
    list_display = ['name', 'designation', 'user']
    
admin.site.register(Technician, TechnicianAdmin)
admin.site.register(ServiceStatus)
