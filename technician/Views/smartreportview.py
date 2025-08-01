import base64
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework import status
from camp_manager.Models.Patientdata import PatientData
from technician.Models.vitals import Vitals
from technician.Models.pathology import Pathology
from technician.Models.smartreport import SmartReport

class SmartReportDataView(APIView):
    def get(self, request, patient_id):
        try:
            patient = PatientData.objects.get(unique_patient_id=patient_id)
            vitals = Vitals.objects.get(patient=patient)
            pathology = Pathology.objects.get(patient=patient)

            bmr_base64 = None
            if vitals.bmr_pdf:
                with open(vitals.bmr_pdf.path, "rb") as f:
                    bmr_base64 = base64.b64encode(f.read()).decode("utf-8")

            data = {
                "patient": {
                    "unique_patient_id": patient.unique_patient_id,
                    "name": patient.patient_name,
                    "age": patient.age,
                    "gender": patient.gender,
                    "photo_url": request.build_absolute_uri(patient.photo.url) if patient.photo else request.build_absolute_uri('/media/patient_photos/default.jpeg'),
                    # "camp_name": patient.camp.camp_name if patient.camp else None,
                },
                "vitals": {
                    # "height": vitals.height,
                    # "weight": vitals.weight,
                    "bp": vitals.bp,
                    "oxygen_saturation": vitals.oxygen_saturation,
                    "heart_rate": vitals.heart_rate,
                    # "body_fat": vitals.body_fat,
                    "body_temperature": vitals.body_temperature,
                    # "muscle_mass": vitals.muscle_mass,
                    # "skeletal_muscle": vitals.skeletal_muscle,
                    # "protein_rate": vitals.protein_rate,
                    # "protein_mass": vitals.protein_mass,
                    # "bmr": vitals.bmr,
                },
                "pathology": {
                    "rbc": pathology.rbc,
                    "hb": pathology.hb,
                    "random_blood_sugar": pathology.blood_sugar_level,  # Assuming this is the same as blood_sugar_level
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
