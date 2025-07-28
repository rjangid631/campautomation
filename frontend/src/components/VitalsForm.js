// Updated VitalsForm with service completion logic
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
    abdomen: ""
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

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors = [];

    if (formData.height && (parseFloat(formData.height) < 50 || parseFloat(formData.height) > 300)) {
      errors.push("Height should be between 50 and 300 cm");
    }
    if (formData.weight && (parseFloat(formData.weight) < 1 || parseFloat(formData.weight) > 500)) {
      errors.push("Weight should be between 1 and 500 kg");
    }
    if (formData.bp && !/^\d{2,3}\/\d{2,3}$/.test(formData.bp)) {
      errors.push("Blood pressure should be in format like 120/80");
    }
    if (formData.pulse && (parseInt(formData.pulse) < 30 || parseInt(formData.pulse) > 300)) {
      errors.push("Pulse should be between 30 and 300 bpm");
    }
    if (formData.oxygen_saturation && (formData.oxygen_saturation < 0 || formData.oxygen_saturation > 100)) {
      errors.push("Oxygen saturation should be between 0 and 100%");
    }
    if (formData.body_temperature && (formData.body_temperature < 30 || formData.body_temperature > 45)) {
      errors.push("Body temperature should be between 30°C and 45°C");
    }
    if (formData.inhale && formData.inhale < 0) {
      errors.push("Chest inhale must be a positive number");
    }
    if (formData.exhale && formData.exhale < 0) {
      errors.push("Chest exhale must be a positive number");
    }

    return errors;
  };

  const handleSubmit = async () => {
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
      const submitData = { ...formData };

      Object.keys(submitData).forEach((key) => {
        if (key !== "patient_unique_id" && submitData[key] === "") {
          submitData[key] = null;
        }
      });

      if (submitData.height) submitData.height = parseFloat(submitData.height);
      if (submitData.weight) submitData.weight = parseFloat(submitData.weight);
      if (submitData.pulse) submitData.pulse = parseInt(submitData.pulse);
      if (submitData.oxygen_saturation) submitData.oxygen_saturation = parseFloat(submitData.oxygen_saturation);
      if (submitData.body_temperature) submitData.body_temperature = parseFloat(submitData.body_temperature);
      if (submitData.inhale) submitData.inhale = parseFloat(submitData.inhale);
      if (submitData.exhale) submitData.exhale = parseFloat(submitData.exhale);


      // 1. Submit vitals data
      const res = await fetch("http://127.0.0.1:8000/api/technician/vitals/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to save vitals data");
      }

      console.log("✅ Vitals data submitted");

      // 2. Mark service as completed
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
        const data = await completeRes.json();
        throw new Error(data?.message || "Failed to mark service as completed");
      }

      console.log("✅ Service marked as completed");
      setSuccess("Vitals data saved and service marked as completed!");
      setTimeout(() => navigate(-1), 2000);

    } catch (err) {
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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-300 p-6 rounded mb-6">
            <p className="text-red-800 font-semibold">Error</p>
            <p className="text-red-600">Missing patient information. Please go back and select a patient.</p>
            <button
              onClick={handleBack}
              className="mt-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vitals Assessment</h1>
            <p className="text-gray-600 mt-1">
              Patient: {patientName} | ID: {patientId}
              {technicianId && (
                <span className="ml-4 text-sm text-gray-500">
                  Technician ID: {technicianId}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleBack}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 p-4 rounded mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-300 p-4 rounded mb-6">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Physical Measurements */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Physical Measurements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Height (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  min="50"
                  max="300"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 165.5"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="500"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 70.5"
                />
              </div>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Vital Signs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Blood Pressure (mmHg)</label>
                <input
                  type="text"
                  value={formData.bp}
                  onChange={(e) => handleInputChange("bp", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 120/80"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Pulse (bpm)</label>
                <input
                  type="number"
                  min="30"
                  max="300"
                  value={formData.pulse}
                  onChange={(e) => handleInputChange("pulse", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 72"
                />
              </div>
            </div>
          </div>

          {/* BMI Calculation */}
          {formData.height && formData.weight && (
            <div className="bg-blue-50 p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">BMI Calculation</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600">BMI Value</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {((parseFloat(formData.weight) || 0) / Math.pow((parseFloat(formData.height) || 1) / 100, 2)).toFixed(1)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Category</p>
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
                <div className="text-center">
                  <p className="text-sm text-gray-600">Reference</p>
                  <p className="text-xs text-gray-500">
                    Normal: 18.5–24.9<br />
                    Overweight: 25–29.9<br />
                    Obese: ≥30
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* Advanced Vitals */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Advanced Vitals</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Oxygen Saturation (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={formData.oxygen_saturation}
                  onChange={(e) => handleInputChange("oxygen_saturation", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 98.5"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Body Temperature (°C)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="45"
                  value={formData.body_temperature}
                  onChange={(e) => handleInputChange("body_temperature", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 36.6"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Chest Inhale (sec/liters)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.inhale}
                  onChange={(e) => handleInputChange("inhale", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 3.5"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Chest Exhale (sec/liters)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.exhale}
                  onChange={(e) => handleInputChange("exhale", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 2.8"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-2 text-sm font-medium text-gray-700">Abdomen Notes</label>
                <input
                  type="text"
                  value={formData.abdomen}
                  onChange={(e) => handleInputChange("abdomen", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Soft, non-tender"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Vitals Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VitalsForm;
