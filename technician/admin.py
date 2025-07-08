from django.contrib import admin
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
        # Auto-hash plain text password if not already hashed
        password = form.cleaned_data.get('password')
        if password and not password.startswith('pbkdf2_'):
            obj.set_password(password)
        super().save_model(request, obj, form, change)
    
admin.site.register(Technician, TechnicianAdmin)
admin.site.register(ServiceStatus)