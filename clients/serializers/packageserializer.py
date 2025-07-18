from rest_framework import serializers
from clients.models.package import Package
from clients.models.service import Service

class PackageSerializer(serializers.ModelSerializer):
    services = serializers.ListField(child=serializers.CharField(), write_only=True)
    service_ids = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Package
        fields = ['id', 'client', 'camp', 'name', 'services', 'service_ids', 'start_date', 'end_date','technicians']

    def validate_services(self, value):
        queryset = Service.objects.filter(name__in=value)
        if len(queryset) != len(set(value)):
            found = set(queryset.values_list('name', flat=True))
            missing = set(value) - found
            raise serializers.ValidationError(f"Invalid service(s): {', '.join(missing)}")
        return queryset

    def create(self, validated_data):
        services_qs = validated_data.pop('services')
        package = Package.objects.create(**validated_data)
        package.services.set(services_qs)
        return package

    def update(self, instance, validated_data):
        services_qs = validated_data.pop('services', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if services_qs is not None:
            instance.services.set(services_qs)
        return instance

    def get_service_ids(self, obj):
        return list(obj.services.values_list('id', flat=True))