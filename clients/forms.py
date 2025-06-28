from django import forms
from clients.models.package import Package
from clients.models.camp import Camp

class PackageAdminForm(forms.ModelForm):
    class Meta:
        model = Package
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # ✅ Explicitly set a label to ensure it's styled properly in admin
        self.fields['camp'].label = "Camp"

        # ✅ Optional: Set a placeholder/empty label
        self.fields['camp'].empty_label = "Select Camp"

        if self.instance and self.instance.client:
            self.fields['camp'].queryset = Camp.objects.filter(client=self.instance.client)
        else:
            # ✅ To avoid the "Select" label with no bold label, use .all() here
            self.fields['camp'].queryset = Camp.objects.all()  # Not .none()
