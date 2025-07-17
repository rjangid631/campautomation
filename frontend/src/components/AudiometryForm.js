import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function AudiometryForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const { patientId, patientName, technicianId, serviceId } = location.state || {};

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    patient_unique_id: "",  // ✅ Changed from 'patient'
    left_air_250: "", left_air_500: "", left_air_1000: "", left_air_2000: "", left_air_4000: "", left_air_8000: "",
    right_air_250: "", right_air_500: "", right_air_1000: "", right_air_2000: "", right_air_4000: "", right_air_8000: "",
    left_bone_250: "", left_bone_500: "", left_bone_1000: "", left_bone_2000: "", left_bone_4000: "",
    right_bone_250: "", right_bone_500: "", right_bone_1000: "", right_bone_2000: "", right_bone_4000: "",
    left_ear_finding: "", right_ear_finding: ""
  });

  const findingOptions = [
    { value: "", display: "Select Finding" },
    { value: "Normal", display: "Normal" },
    { value: "Mild", display: "Mild" },
    { value: "Moderate", display: "Moderate" },
    { value: "Moderate-Severe", display: "Moderate-Severe" },
    { value: "Severe", display: "Severe" },
    { value: "Profound", display: "Profound" }
  ];

  const frequencies = [
    { key: "250", label: "250 Hz" }, { key: "500", label: "500 Hz" },
    { key: "1000", label: "1000 Hz" }, { key: "2000", label: "2000 Hz" },
    { key: "4000", label: "4000 Hz" }, { key: "8000", label: "8000 Hz" }
  ];
  const boneFrequencies = frequencies.slice(0, 5);

  useEffect(() => {
    if (!patientId || !patientName) {
      setError("Missing patient information. Please go back and try again.");
      return;
    }

    setPatient({
      patient_name: patientName,
      unique_patient_id: patientId
    });

    setFormData((prev) => ({ ...prev, patient_unique_id: patientId })); // ✅ Fix here
  }, [patientId, patientName]);

  const handleInputChange = (field, value) => {
    if (field === "left_ear_finding" || field === "right_ear_finding") {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value === "" ? "" : parseInt(value) || ""
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const submitData = { ...formData };
      Object.keys(submitData).forEach((key) => {
        if (!["left_ear_finding", "right_ear_finding", "patient_unique_id"].includes(key)) {
          if (submitData[key] === "") submitData[key] = null;
        }
      });

      // 1. Submit audiometry data
      const res = await fetch("http://127.0.0.1:8000/api/technician/audiometry/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.patient_unique_id || data.message || "Failed to save audiometry data");
      }

      console.log("✅ Audiometry data submitted");

      // 2. Mark service as completed using serviceId
      const completeRes = await fetch("http://127.0.0.1:8000/api/technician/submit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patientId,
          technician_id: technicianId,
          service_id: serviceId
        }),
      });

      if (!completeRes.ok) {
        const data = await completeRes.json();
        throw new Error(data?.message || "Failed to mark service as completed");
      }

      console.log("✅ Service marked as completed");

      setSuccess("Audiometry saved and service marked as completed!");
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

  const renderThresholdInput = (ear, type, frequency) => {
    const fieldName = `${ear}_${type}_${frequency}`;
    return (
      <input
        type="number"
        value={formData[fieldName]}
        onChange={(e) => handleInputChange(fieldName, e.target.value)}
        className="w-20 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="dB"
        min="-10"
        max="120"
      />
    );
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
            <h1 className="text-2xl font-bold text-gray-800">Audiometry Test</h1>
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
          {/* Air Conduction */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Air Conduction Thresholds (dB HL)</h2>
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Frequency</th>
                  <th className="p-2 text-center">Left Ear</th>
                  <th className="p-2 text-center">Right Ear</th>
                </tr>
              </thead>
              <tbody>
                {frequencies.map((freq) => (
                  <tr key={freq.key}>
                    <td className="p-2 font-medium">{freq.label}</td>
                    <td className="p-2 text-center">{renderThresholdInput("left", "air", freq.key)}</td>
                    <td className="p-2 text-center">{renderThresholdInput("right", "air", freq.key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bone Conduction */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Bone Conduction Thresholds (dB HL)</h2>
            <table className="w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 text-left">Frequency</th>
                  <th className="p-2 text-center">Left Ear</th>
                  <th className="p-2 text-center">Right Ear</th>
                </tr>
              </thead>
              <tbody>
                {boneFrequencies.map((freq) => (
                  <tr key={freq.key}>
                    <td className="p-2 font-medium">{freq.label}</td>
                    <td className="p-2 text-center">{renderThresholdInput("left", "bone", freq.key)}</td>
                    <td className="p-2 text-center">{renderThresholdInput("right", "bone", freq.key)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clinical Findings */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Clinical Findings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Left Ear Finding</label>
                <select
                  value={formData.left_ear_finding}
                  onChange={(e) => handleInputChange("left_ear_finding", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {findingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Right Ear Finding</label>
                <select
                  value={formData.right_ear_finding}
                  onChange={(e) => handleInputChange("right_ear_finding", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {findingOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
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
              {loading ? "Saving..." : "Save Audiometry Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudiometryForm;
