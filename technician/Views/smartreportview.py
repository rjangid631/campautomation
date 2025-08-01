import base64
import os
from django.conf import settings

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from camp_manager.Models.Patientdata import PatientData
from technician.Models.vitals import Vitals
from technician.Models.pathology import Pathology


class SmartReportDataView(APIView):
    def get(self, request, patient_id):
        try:
            patient = PatientData.objects.get(unique_patient_id=patient_id)
            vitals = Vitals.objects.get(patient=patient)
            pathology = Pathology.objects.get(patient=patient)

            # Convert BMR PDF to base64
            bmr_base64 = None
            if vitals.bmr_pdf:
                with open(vitals.bmr_pdf.path, "rb") as f:
                    bmr_base64 = base64.b64encode(f.read()).decode("utf-8")

            # Convert patient photo to base64
            if patient.photo and os.path.exists(patient.photo.path):
                photo_path = patient.photo.path
            else:
                photo_path = os.path.join(settings.MEDIA_ROOT, 'patient_photos/default.jpeg')

            try:
                with open(photo_path, "rb") as img_file:
                    photo_base64 = base64.b64encode(img_file.read()).decode("utf-8")
            except Exception as e:
                photo_base64 = None

            data = {
                "patient": {
                    "unique_patient_id": patient.unique_patient_id,
                    "name": patient.patient_name,
                    "age": patient.age,
                    "gender": patient.gender,
                    "photo_base64": photo_base64,
                    # "camp_name": patient.camp.camp_name if patient.camp else None,
                },
                "vitals": {
                    "bp": vitals.bp,
                    "oxygen_saturation": vitals.oxygen_saturation,
                    "heart_rate": vitals.heart_rate,
                    "body_temperature": vitals.body_temperature,
                },
                "pathology": {
                    "rbc": pathology.rbc,
                    "hb": pathology.hb,
                    "random_blood_sugar": pathology.blood_sugar_level,
                    "creatinine": pathology.creatinine,
                    "egfr": pathology.egfr,
                    "total_bilirubin": pathology.total_bilirubin,
                    "direct_bilirubin": pathology.direct_bilirubin,
                    "indirect_bilirubin": pathology.indirect_bilirubin,
                    "total_cholesterol": pathology.total_cholesterol,
                    "triglycerides": pathology.triglycerides,
                    "ldl": pathology.ldl,
                    "hdl": pathology.hdl,
                    "vldl": pathology.vldl,
                    "pcv": pathology.pcv,
                    "mcv": pathology.mcv,
                    "mch": pathology.mch,
                    "mchc": pathology.mchc,
                    "lipids": pathology.lipids,
                },
                "bmr_pdf_base64": bmr_base64
            }

            return Response(data, status=status.HTTP_200_OK)

        except PatientData.DoesNotExist:
            return Response({"error": "Patient not found"}, status=status.HTTP_404_NOT_FOUND)
        except Vitals.DoesNotExist:
            return Response({"error": "Vitals data not found"}, status=status.HTTP_404_NOT_FOUND)
        except Pathology.DoesNotExist:
            return Response({"error": "Pathology data not found"}, status=status.HTTP_404_NOT_FOUND)
