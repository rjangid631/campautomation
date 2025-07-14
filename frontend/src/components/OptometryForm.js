import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function OptometryForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const { patientId, patientName, technicianId } = location.state || {};

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    patient_unique_id: "",
    far_vision_right: "",
    far_vision_left: "",
    near_vision_right: "",
    near_vision_left: "",
    color_vision_normal: false,
    color_vision_other: ""
  });

  // Common vision measurement options
  const visionOptions = [
    { value: "", display: "Select Vision" },
    { value: "6/6", display: "6/6 (Normal)" },
    { value: "6/9", display: "6/9" },
    { value: "6/12", display: "6/12" },
    { value: "6/18", display: "6/18" },
    { value: "6/24", display: "6/24" },
    { value: "6/36", display: "6/36" },
    { value: "6/60", display: "6/60" },
    { value: "3/60", display: "3/60" },
    { value: "1/60", display: "1/60" },
    { value: "HM", display: "Hand Movement" },
    { value: "CF", display: "Counting Fingers" },
    { value: "PL", display: "Perception of Light" },
    { value: "NPL", display: "No Perception of Light" }
  ];

  const nearVisionOptions = [
    { value: "", display: "Select Near Vision" },
    { value: "N6", display: "N6 (Normal)" },
    { value: "N8", display: "N8" },
    { value: "N10", display: "N10" },
    { value: "N12", display: "N12" },
    { value: "N14", display: "N14" },
    { value: "N18", display: "N18" },
    { value: "N24", display: "N24" },
    { value: "N36", display: "N36" },
    { value: "N48", display: "N48" },
    { value: "N60", display: "N60" }
  ];

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
    if (field === "color_vision_normal") {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
        // Clear other color vision field if normal is selected
        color_vision_other: value ? "" : prev.color_vision_other
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const submitData = { ...formData };
      
      // Convert empty strings to null for optional fields
      Object.keys(submitData).forEach((key) => {
        if (!["patient_unique_id", "color_vision_normal"].includes(key)) {
          if (submitData[key] === "") submitData[key] = null;
        }
      });

      console.log("Submitting data:", submitData);

      const res = await fetch("http://127.0.0.1:8000/api/technician/optometry/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.patient_unique_id || data.message || "Failed to save data");
      }

      setSuccess("Optometry data saved successfully!");

      setTimeout(() => {
        navigate(-1);
      }, 2000);
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
            <h1 className="text-2xl font-bold text-gray-800">Optometry Test</h1>
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
          {/* Far Vision */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Far Vision Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Right Eye</label>
                <select
                  value={formData.far_vision_right}
                  onChange={(e) => handleInputChange("far_vision_right", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {visionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Left Eye</label>
                <select
                  value={formData.far_vision_left}
                  onChange={(e) => handleInputChange("far_vision_left", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {visionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Near Vision */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Near Vision Assessment</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Right Eye</label>
                <select
                  value={formData.near_vision_right}
                  onChange={(e) => handleInputChange("near_vision_right", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nearVisionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Left Eye</label>
                <select
                  value={formData.near_vision_left}
                  onChange={(e) => handleInputChange("near_vision_left", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {nearVisionOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Color Vision */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Color Vision Assessment</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="color_vision_normal"
                  checked={formData.color_vision_normal}
                  onChange={(e) => handleInputChange("color_vision_normal", e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="color_vision_normal" className="ml-2 text-sm font-medium text-gray-700">
                  Color Vision Normal
                </label>
              </div>
              
              {!formData.color_vision_normal && (
                <div>
                  <label className="block mb-2 text-sm font-medium text-gray-700">
                    Other Color Vision Issues
                  </label>
                  <textarea
                    value={formData.color_vision_other}
                    onChange={(e) => handleInputChange("color_vision_other", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Describe any color vision abnormalities..."
                  />
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-center">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save Optometry Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptometryForm;