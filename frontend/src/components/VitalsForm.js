import React, { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// Moved InputBlock outside to prevent re-renders
function InputBlock({ label, field, type = "text", placeholder, value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(e) => onChange(field, e.target.value)}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
        placeholder={placeholder || `Enter ${label.toLowerCase()}`}
      />
    </div>
  );
}

function VitalsForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const { patientId, patientName, technicianId, serviceId } = location.state || {};

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    patient_unique_id: "",
    height: "",
    weight: "",
    bp: "",
    pulse: "",
    oxygen_saturation: "",
    body_temperature: "",
    inhale: "",
    exhale: "",
    abdomen: "",
    heart_rate: "",
    body_fat: "",
    visceral_rate: "",
    bmr: "",
    muscle_mass: "",
    muscle_rate: "",
    skeletal_muscle: "",
    bone_mass: "",
    protein_rate: "",
    protein_mass: "",
    bmr_pdf: null, // Changed to null for file handling
  });

  useEffect(() => {
    if (!patientId || !patientName) {
      setError("Missing patient information. Please go back and try again.");
      return;
    }

    setPatient({
      patient_name: patientName,
      unique_patient_id: patientId
    });

    setFormData((prev) => ({ ...prev, patient_unique_id: patientId }));
  }, [patientId, patientName]);

  const handleInputChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Handle file input separately
  const handleFileChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        bmr_pdf: e.target.files[0]
      }));
    }
  }, []);

  // Removed restrictive validation - now only validates format for BP
  const validateForm = () => {
    const errors = [];

    // Only validate blood pressure format if provided
    if (formData.bp && formData.bp.trim() && !/^\d+\/\d+$/.test(formData.bp)) {
      errors.push("Blood pressure should be in format like 120/80");
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Submit button clicked!");
    
    setLoading(true);
    setError("");
    setSuccess("");

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(", "));
      setLoading(false);
      return;
    }

    try {
      // Create FormData for multipart/form-data submission
      const formPayload = new FormData();

      // Add patient ID (required field)
      formPayload.append("patient_unique_id", formData.patient_unique_id);

      // Add all other fields, converting empty strings to null and handling numeric conversion
      const numericFields = [
        'height', 'weight', 'pulse', 'oxygen_saturation', 'body_temperature',
        'inhale', 'exhale', 'heart_rate', 'body_fat', 'visceral_rate', 'bmr',
        'muscle_mass', 'muscle_rate', 'skeletal_muscle', 'bone_mass', 'protein_rate', 'protein_mass'
      ];

      // Handle numeric fields
      numericFields.forEach(field => {
        const value = formData[field];
        if (value && value.toString().trim() !== "") {
          // Convert to appropriate numeric type
          if (field === 'pulse') {
            formPayload.append(field, parseInt(value));
          } else {
            formPayload.append(field, parseFloat(value));
          }
        }
      });

      // Handle text fields
      if (formData.bp && formData.bp.trim()) {
        formPayload.append("bp", formData.bp.trim());
      }
      if (formData.abdomen && formData.abdomen.trim()) {
        formPayload.append("abdomen", formData.abdomen.trim());
      }

      // Handle file upload
      if (formData.bmr_pdf && formData.bmr_pdf instanceof File) {
        formPayload.append("bmr_pdf", formData.bmr_pdf);
        console.log("📎 BMR PDF file added to form data:", formData.bmr_pdf.name);
      }

      console.log("Submitting form data...");
      
      // Log FormData contents for debugging
      for (let [key, value] of formPayload.entries()) {
        console.log(`${key}:`, value);
      }

      // Submit vitals data with file
      const res = await fetch("http://127.0.0.1:8000/api/technician/vitals/", {
        method: "POST",
        body: formPayload, // Don't set Content-Type header - let browser set it for multipart/form-data
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ message: "Failed to parse error response" }));
        throw new Error(data?.message || `HTTP ${res.status}: Failed to save vitals data`);
      }

      console.log("✅ Vitals data submitted (including BMR file if provided)");

      // Mark service as completed (only if serviceId is provided)
      if (serviceId && technicianId) {
        const completeRes = await fetch("http://127.0.0.1:8000/api/technician/submit/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: patientId,
            technician_id: technicianId,
            service_id: serviceId,
          }),
        });

        if (!completeRes.ok) {
          const data = await completeRes.json().catch(() => ({ message: "Failed to parse error response" }));
          throw new Error(data?.message || `HTTP ${completeRes.status}: Failed to mark service as completed`);
        }

        console.log("✅ Service marked as completed");
        setSuccess("Vitals data saved and service marked as completed!");
      } else {
        setSuccess("Vitals data saved successfully!");
      }

      // Navigate back after a delay
      setTimeout(() => navigate(-1), 2000);

    } catch (err) {
      console.error("Submit error:", err);
      setError(err.message || "Error submitting form");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (!patientId || !patientName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">Missing patient information. Please go back and select a patient.</p>
                <button
                  onClick={handleBack}
                  className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors duration-200"
                >
                  ← Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Vitals Assessment</h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
                  Patient: {patientName}
                </span>
                <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full font-medium">
                  ID: {patientId}
                </span>
                {technicianId && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                    Technician: {technicianId}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleBack}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6 shadow-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Physical Measurements */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Physical Measurements</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputBlock 
                label="Height (cm)" 
                field="height" 
                type="number" 
                placeholder="e.g., 165.5"
                value={formData.height}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Weight (kg)" 
                field="weight" 
                type="number" 
                placeholder="e.g., 70.5"
                value={formData.weight}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* BMI Calculation */}
          {formData.height && formData.weight && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800">BMI Calculation</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">BMI Value</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {((parseFloat(formData.weight) || 0) / Math.pow((parseFloat(formData.height) || 1) / 100, 2)).toFixed(1)}
                  </p>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">Category</p>
                  <p className="text-lg font-semibold text-gray-800">
                    {(() => {
                      const bmi = (parseFloat(formData.weight) || 0) / Math.pow((parseFloat(formData.height) || 1) / 100, 2);
                      if (bmi < 18.5) return "Underweight";
                      if (bmi < 25) return "Normal";
                      if (bmi < 30) return "Overweight";
                      return "Obese";
                    })()}
                  </p>
                </div>
                <div className="text-center bg-white rounded-lg p-4 shadow-sm">
                  <p className="text-sm text-gray-600 mb-2">Reference</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Normal: 18.5–24.9</div>
                    <div>Overweight: 25–29.9</div>
                    <div>Obese: ≥30</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vital Signs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-red-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Vital Signs</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  value={formData.bp}
                  onChange={(e) => handleInputChange("bp", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., 120/80"
                />
              </div>
              <InputBlock 
                label="Pulse (bpm)" 
                field="pulse" 
                type="number" 
                placeholder="e.g., 72"
                value={formData.pulse}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Advanced Vitals */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Advanced Vitals</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputBlock 
                label="Oxygen Saturation (%)" 
                field="oxygen_saturation" 
                type="number" 
                placeholder="e.g., 98.5"
                value={formData.oxygen_saturation}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Body Temperature (°C)" 
                field="body_temperature" 
                type="number" 
                placeholder="e.g., 36.6"
                value={formData.body_temperature}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Chest Inhale (sec/liters)" 
                field="inhale" 
                type="number" 
                placeholder="e.g., 3.5"
                value={formData.inhale}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Chest Exhale (sec/liters)" 
                field="exhale" 
                type="number" 
                placeholder="e.g., 2.8"
                value={formData.exhale}
                onChange={handleInputChange}
              />
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-medium text-gray-700">Abdomen Notes</label>
                <input
                  type="text"
                  value={formData.abdomen}
                  onChange={(e) => handleInputChange("abdomen", e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="e.g., Soft, non-tender"
                />
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">Additional Metrics</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InputBlock 
                label="Heart Rate (bpm)" 
                field="heart_rate" 
                type="number" 
                placeholder="e.g., 72"
                value={formData.heart_rate}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Body Fat (%)" 
                field="body_fat" 
                type="number" 
                placeholder="e.g., 15.2"
                value={formData.body_fat}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Visceral Rate" 
                field="visceral_rate" 
                type="number" 
                placeholder="e.g., 8.5"
                value={formData.visceral_rate}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="BMR (kcal/day)" 
                field="bmr" 
                type="number" 
                placeholder="e.g., 1650"
                value={formData.bmr}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Muscle Mass (kg)" 
                field="muscle_mass" 
                type="number" 
                placeholder="e.g., 45.2"
                value={formData.muscle_mass}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Muscle Rate (%)" 
                field="muscle_rate" 
                type="number" 
                placeholder="e.g., 35.8"
                value={formData.muscle_rate}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Skeletal Muscle (%)" 
                field="skeletal_muscle" 
                type="number" 
                placeholder="e.g., 28.4"
                value={formData.skeletal_muscle}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Bone Mass (kg)" 
                field="bone_mass" 
                type="number" 
                placeholder="e.g., 2.8"
                value={formData.bone_mass}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Protein Rate (%)" 
                field="protein_rate" 
                type="number" 
                placeholder="e.g., 18.5"
                value={formData.protein_rate}
                onChange={handleInputChange}
              />
              <InputBlock 
                label="Protein Mass (kg)" 
                field="protein_mass" 
                type="number" 
                placeholder="e.g., 12.8"
                value={formData.protein_mass}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* BMR PDF Upload */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <div className="flex items-center mb-6">
              <div className="bg-purple-100 p-2 rounded-lg mr-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-800">BMR Report Upload</h2>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload BMR Report (PDF)
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
              {formData.bmr_pdf && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ File selected: {formData.bmr_pdf.name}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-8">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-12 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 shadow-lg"
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Vitals Data
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VitalsForm;