from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from clients.forms import PackageAdminForm
from clients.models.serviceselection import ServiceSelection
from clients.models.package import Package
from clients.models.camp import Camp
# from clients.models.companydetails import CompanyDetails  # Removed: module not found
from clients.models.copyprice import CopyPrice
from clients.models.costdetails import CostDetails
from clients.models.costsummary import CostSummary
from clients.models.discountcoupon import DiscountCoupon
from clients.models.estimation import Estimation
from clients.models.service import Service
from clients.models.servicecost import ServiceCost
from clients.models.servicedetails import ServiceDetails
from clients.models.testdata import TestData
from clients.models.testtype import TestType
from clients.models.pricerange import PriceRange
from clients.models.client import Client  # Your main client model

# ----------------- Inlines & Custom Admins -----------------

class PriceRangeInline(admin.TabularInline):
    model = PriceRange
    extra = 1

class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name',)
    inlines = [PriceRangeInline]

class PriceRangeAdmin(admin.ModelAdmin):
    list_display = ('service', 'max_cases', 'price')
    list_filter = ('service',)
    search_fields = ('service__name',)

@admin.register(Client)
class ClientAdmin(UserAdmin):
    model = Client
    list_display = ('client_id', 'name', 'email', 'contact_number', 'login_type', 'gst_number', 'pan_card', 'state')
    list_filter = ('login_type', 'state', 'is_active', 'is_staff')
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('name', 'contact_number', 'client_id', 'login_type', 'gst_number', 'pan_card', 'district', 'state', 'pin_code', 'landmark')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'name', 'contact_number', 'password1', 'password2', 'login_type', 'is_active', 'is_staff')}
        ),
    )
    search_fields = ('client_id', 'name', 'email', 'contact_number', 'gst_number')
    ordering = ('email',)

@admin.register(Camp)
class CampAdmin(admin.ModelAdmin):
    list_display = ('client', 'location', 'district', 'state', 'pin_code', 'start_date', 'end_date', 'ready_to_go')  # ✅ Added 'ready_to_go'
    list_editable = ('ready_to_go',)
    search_fields = ('location', 'client__name')

@admin.register(ServiceSelection)
class ServiceSelectionAdmin(admin.ModelAdmin):
    list_display = ('client', 'selected_services')
    readonly_fields = ('selected_services',)
    search_fields = ('client__name',)

@admin.register(TestData)
class TestDataAdmin(admin.ModelAdmin):
    list_display = ('client', 'service_name', 'case_per_day', 'number_of_days', 'total_case')
    search_fields = ('service_name', 'client__name')


@admin.register(CostDetails)
class CostDetailsAdmin(admin.ModelAdmin):
    list_display = ('client', 'service_name', 'travel', 'stay', 'food', 'salary', 'misc', 'equipment', 'consumables', 'reporting')
    search_fields = ('client__name', 'service_name')

@admin.register(CostSummary)
class CostSummaryAdmin(admin.ModelAdmin):
    list_display = ('client', 'billing_number', 'grand_total', 'created_at')
    search_fields = ('client__name', 'billing_number')
    list_filter = ('created_at',)

@admin.register(Estimation)
class EstimationAdmin(admin.ModelAdmin):
    list_display = ('client', 'created_at', 'pdf_file')
    readonly_fields = ('created_at',)

@admin.register(DiscountCoupon)
class DiscountCouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percentage')

@admin.register(CopyPrice)
class CopyPriceAdmin(admin.ModelAdmin):
    list_display = ('name', 'hard_copy_price')
    search_fields = ('name',)

@admin.register(Package)
class PackageAdmin(admin.ModelAdmin):
    form = PackageAdminForm 
    list_display = ('name', 'camp','client', 'start_date', 'end_date')
    filter_horizontal = ['services']
    list_filter = ['start_date', 'end_date']
    search_fields = ['name', 'client__name']

@admin.register(TestType)
class TestTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(ServiceCost)
class ServiceCostAdmin(admin.ModelAdmin):
    list_display = ('test_type', 'salary', 'incentive', 'misc', 'equipment', 'consumables', 'reporting')

admin.site.register(Service, ServiceAdmin)
admin.site.register(PriceRange, PriceRangeAdmin)

# Optional / legacy (if needed)
# admin.site.register(CompanyDetails)  # Removed: model not found
admin.site.register(ServiceDetails)
