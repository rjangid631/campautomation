import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from './api';

function OptometryForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const OPTOMETRY_URL = '/technician/optometry/';
  const SUBMIT_SERVICE_URL = '/technician/submit/';

  const { patientId, patientName, technicianId, serviceId } = location.state || {};

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState({
    patient_unique_id: "",
    // Vision fields
    far_vision_right: "",
    far_vision_left: "",
    near_vision_right: "",
    near_vision_left: "",
    // Refraction (Right Eye)
    spherical_right: "",
    cylindrical_right: "",
    axis_right: "",
    add_right: "",
    // Refraction (Left Eye)
    spherical_left: "",
    cylindrical_left: "",
    axis_left: "",
    add_left: "",
    // Color Vision
    color_vision_normal: false,
    color_vision_other: "",
    color_vision_remark: ""
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
    { value: "N/6", display: "N/6 (Normal)" },
    { value: "N/8", display: "N/8" },
    { value: "N/10", display: "N/10" },
    { value: "N/12", display: "N/12" },
    { value: "N/14", display: "N/14" },
    { value: "N/18", display: "N/18" },
    { value: "N/24", display: "N/24" },
    { value: "N/36", display: "N/36" },
    { value: "N/48", display: "N/48" },
    { value: "N/60", display: "N/60" }
  ];

  // Spherical power options
  const sphericalOptions = [
    { value: "", display: "Select Spherical Power" },
    { value: "Plano", display: "Plano" },
    ...Array.from({ length: 60 }, (_, i) => {
      const value = ((i + 1) * 0.25).toFixed(2);
      return { value: `+${value}`, display: `+${value}` };
    }),
    ...Array.from({ length: 60 }, (_, i) => {
      const value = ((i + 1) * 0.25).toFixed(2);
      return { value: `-${value}`, display: `-${value}` };
    })
  ];

  // Cylindrical power options
  const cylindricalOptions = [
    { value: "", display: "Select Cylindrical Power" },
    { value: "Plano", display: "Plano" },
    ...Array.from({ length: 24 }, (_, i) => {
      const value = ((i + 1) * 0.25).toFixed(2);
      return { value: `+${value}`, display: `+${value}` };
    }),
    ...Array.from({ length: 24 }, (_, i) => {
      const value = ((i + 1) * 0.25).toFixed(2);
      return { value: `-${value}`, display: `-${value}` };
    })
  ];

  // Axis options (1-180 degrees)
  const axisOptions = [
    { value: "", display: "Select Axis" },
    ...Array.from({ length: 180 }, (_, i) => {
      const value = i + 1;
      return { value: value.toString(), display: `${value}°` };
    })
  ];

  // Add power options
  const addOptions = [
    { value: "", display: "Select Add Power" },
    ...Array.from({ length: 12 }, (_, i) => {
      const value = ((i + 1) * 0.25).toFixed(2);
      return { value: `+${value}`, display: `+${value}` };
    })
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
    setError('');
    setSuccess('');

    try {
      // 📝 Prepare form data
      const submitData = { ...formData, technician_id: technicianId };

      // Fields that should NOT be set to null
      const preservedFields = ["patient_unique_id", "color_vision_normal"];

      // Replace empty strings with null for all other fields
      Object.keys(submitData).forEach((key) => {
        if (!preservedFields.includes(key) && submitData[key] === '') {
          submitData[key] = null;
        }
      });

      console.log("📤 Submitting optometry data:", submitData);

      // 🔁 POST: Submit optometry data
      const response = await api.post(OPTOMETRY_URL, submitData);
      console.log("✅ Optometry data submitted:", response.data);

      // ✅ Mark service as completed
      if (patientId && technicianId && serviceId) {
        const completePayload = {
          patient_id: patientId,
          technician_id: technicianId,
          service_id: serviceId,
        };

        const completeRes = await api.post(SUBMIT_SERVICE_URL, completePayload);
        console.log("✅ Service marked as completed:", completeRes.data);
      }

      // ✅ Show success
      setSuccess("Optometry data saved and service marked as completed!");
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      console.error("❌ Submission error:", err);
      setError(err.response?.data?.message || err.message || "Something went wrong.");
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

          {/* Refraction - Right Eye */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Refraction - Right Eye</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Spherical</label>
                <select
                  value={formData.spherical_right}
                  onChange={(e) => handleInputChange("spherical_right", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sphericalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Cylindrical</label>
                <select
                  value={formData.cylindrical_right}
                  onChange={(e) => handleInputChange("cylindrical_right", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cylindricalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Axis</label>
                <select
                  value={formData.axis_right}
                  onChange={(e) => handleInputChange("axis_right", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {axisOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Add</label>
                <select
                  value={formData.add_right}
                  onChange={(e) => handleInputChange("add_right", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {addOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Refraction - Left Eye */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Refraction - Left Eye</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Spherical</label>
                <select
                  value={formData.spherical_left}
                  onChange={(e) => handleInputChange("spherical_left", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {sphericalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Cylindrical</label>
                <select
                  value={formData.cylindrical_left}
                  onChange={(e) => handleInputChange("cylindrical_left", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {cylindricalOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Axis</label>
                <select
                  value={formData.axis_left}
                  onChange={(e) => handleInputChange("axis_left", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {axisOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.display}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">Add</label>
                <select
                  value={formData.add_left}
                  onChange={(e) => handleInputChange("add_left", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {addOptions.map((opt) => (
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

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Optometrist Remark
                </label>
                <textarea
                  value={formData.color_vision_remark}
                  onChange={(e) => handleInputChange("color_vision_remark", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Optometrist's remarks on color vision test..."
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
              {loading ? "Saving..." : "Save Optometry Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptometryForm;