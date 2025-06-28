from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from camp_manager.Models.Camp_manager import CampManager
from camp_manager.Models.Upload_excel import ExcelUpload
from camp_manager.Models.Patientdata import PatientData
from camp_manager.Models.Camp_report import CampReport

# ✅ 1. Custom Admin for CampManager
class CampManagerAdmin(UserAdmin):
    model = CampManager
    list_display = ('email', 'name', 'contact_number', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'contact_number')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Dates', {'fields': ('last_login',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'contact_number', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    search_fields = ('email', 'name')
    ordering = ('email',)

admin.site.register(CampManager, CampManagerAdmin)

# ✅ 2. ExcelUpload Admin
@admin.register(ExcelUpload)
class ExcelUploadAdmin(admin.ModelAdmin):
    list_display = ('camp', 'package', 'uploaded_at', 'unique_id')
    search_fields = ('unique_id', 'camp__location', 'package__name')
    list_filter = ('camp', 'package', 'uploaded_at')

# ✅ 3. PatientData Admin
@admin.register(PatientData)
class PatientDataAdmin(admin.ModelAdmin):
    list_display = ('patient_name', 'service', 'age', 'gender', 'unique_patient_id', 'excel_upload')
    search_fields = ('patient_name', 'unique_patient_id', 'service')
    list_filter = ('service', 'gender')

# ✅ 4. CampReport Admin
@admin.register(CampReport)
class CampReportAdmin(admin.ModelAdmin):
    list_display = ('camp', 'google_drive_link', 'uploaded_at')
    search_fields = ('camp__location',)
    list_filter = ('uploaded_at',)
