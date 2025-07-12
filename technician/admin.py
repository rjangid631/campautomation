from django.contrib import admin
from technician.Models.audiometry import Audiometry
from technician.Models.technician import Technician
from technician.Models.servicestatus import ServiceStatus
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment


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


admin.site.register(Technician, TechnicianAdmin)
admin.site.register(ServiceStatus)
