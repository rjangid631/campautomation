from django.contrib import admin

from clients.models.serviceselection import ServiceSelection
from clients.models.camp import Camp
from clients.models.company import Company
from clients.models.companydetails import CompanyDetails
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
from clients.models.user import User
from clients.models.pricerange import PriceRange
from clients.models.client import Client  # If still needed separately

# ----------------- Inline & Custom Admins -----------------

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

# ----------------- Admin Registrations -----------------

admin.site.register(Service, ServiceAdmin)
admin.site.register(PriceRange, PriceRangeAdmin)

@admin.register(TestType)
class TestTypeAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(ServiceCost)
class ServiceCostAdmin(admin.ModelAdmin):
    list_display = ('test_type', 'salary', 'incentive', 'misc', 'equipment', 'consumables', 'reporting')

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ('name', 'district', 'state', 'pin_code', 'landmark')
    search_fields = ('name', 'district', 'state')

@admin.register(Camp)
class CampAdmin(admin.ModelAdmin):
    list_display = ('company', 'location', 'district', 'state', 'pin_code', 'start_date', 'end_date')
    search_fields = ('location', 'company__name')

@admin.register(ServiceSelection)
class ServiceSelectionAdmin(admin.ModelAdmin):
    list_display = ('company_id', 'selected_services')
    search_fields = ('company_id',)

@admin.register(TestData)
class TestDataAdmin(admin.ModelAdmin):
    list_display = ('company_id', 'service_name', 'case_per_day', 'number_of_days', 'total_case')
    search_fields = ('service_name', 'company_id')

@admin.register(CostDetails)
class CostDetailsAdmin(admin.ModelAdmin):
    list_display = ('company_id', 'service_name', 'travel', 'stay', 'food', 'salary', 'misc', 'equipment', 'consumables', 'reporting')
    search_fields = ('company_id', 'service_name')

@admin.register(DiscountCoupon)
class DiscountCouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'discount_percentage')

@admin.register(Estimation)
class EstimationAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'created_at', 'pdf_file')
    readonly_fields = ('created_at',)

@admin.register(CostSummary)
class CostSummaryAdmin(admin.ModelAdmin):
    list_display = ('company_name', 'billing_number', 'grand_total', 'created_at')
    search_fields = ('company_name', 'billing_number')
    list_filter = ('created_at',)

@admin.register(CopyPrice)
class CopyPriceAdmin(admin.ModelAdmin):
    list_display = ('name', 'hard_copy_price')
    search_fields = ('name',)

# Default registrations
admin.site.register(User)
admin.site.register(CompanyDetails)
admin.site.register(ServiceDetails)
admin.site.register(Client)  # from clients.models.client
