# Generated by Django 5.2.4 on 2025-07-08 09:14

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('camp_manager', '0004_campmanager_login_type'),
        ('clients', '0017_package_technicians'),
    ]

    operations = [
        migrations.AddField(
            model_name='patientdata',
            name='package',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='patients', to='clients.package'),
        ),
    ]
