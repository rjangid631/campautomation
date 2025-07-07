from django.contrib import admin
from technician.Models.technician import Technician
from technician.Models.servicestatus import ServiceStatus
from technician.Models.technicianserviceassignment import TechnicianServiceAssignment


@admin.register(TechnicianServiceAssignment)
class TechnicianServiceAssignmentAdmin(admin.ModelAdmin):
    list_display = ('technician', 'service', 'camp')
    search_fields = ('technician__name', 'service__name', 'camp__location')
    list_filter = ('camp', 'service')
    
admin.site.register(Technician)
admin.site.register(ServiceStatus)