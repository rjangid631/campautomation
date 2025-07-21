import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  User,
  FileText,
  Stethoscope,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';

const DoctorConsultationForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  const patientId = state?.patientId || '';
  const patientName = state?.patientName || '';
  const technicianId = state?.technicianId || '';
  const serviceId = state?.serviceId || '';

  const [patient, setPatient] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [existingConsultationId, setExistingConsultationId] = useState(null);

  const [formData, setFormData] = useState({
    patient_unique_id: patientId || '',
    has_medical_conditions: 'No',
    medical_conditions: '',
    has_medications: 'No',
    medications: '',
    has_allergies: 'No',
    allergies: '',
    chief_complaint: '',
    history: '',
    diagnostic_tests: '',
    advice: '',
    fitness_status: 'FIT',
    unfit_reason: ''
  });

  const API_BASE_URL = 'http://127.0.0.1:8000/api/technician/doctor-consultation/';

  useEffect(() => {
    if (!patientId || !patientName) {
      setError("Missing patient information. Please go back and try again.");
      setInitialLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        setInitialLoading(true);

        // Fetch existing consultations
        const response = await fetch(API_BASE_URL);
        const consultations = await response.json();

        const existing = consultations.find(
          c => c.patient_unique_id === patientId || (c.patient?.unique_patient_id === patientId)
        );

        if (existing) {
          setIsEditing(true);
          setExistingConsultationId(existing.id);

          const p = existing.patient;
          setPatient({
            patient_name: p?.patient_name || patientName || 'N/A',
            unique_patient_id: p?.unique_patient_id || patientId,
            patient_excel_id: p?.patient_excel_id || patientId,
            age: p?.age || 'N/A',
            gender: p?.gender || 'N/A',
            phone: p?.contact_number || 'N/A'
          });

          setFormData(prev => ({
            ...prev,
            patient_unique_id: patientId,
            has_medical_conditions: existing.has_medical_conditions || 'No',
            medical_conditions: existing.medical_conditions || '',
            has_medications: existing.has_medications || 'No',
            medications: existing.medications || '',
            has_allergies: existing.has_allergies || 'No',
            allergies: existing.allergies || '',
            chief_complaint: existing.chief_complaint || '',
            history: existing.history || '',
            diagnostic_tests: existing.diagnostic_tests || '',
            advice: existing.advice || '',
            fitness_status: existing.fitness_status || 'FIT',
            unfit_reason: existing.unfit_reason || ''
          }));
        } else {
          // 🩺 Fallback: Fetch patient details if no consultation exists
          const patientRes = await fetch(`http://127.0.0.1:8000/api/campmanager/patient/${patientId}/`);
          if (patientRes.ok) {
            const data = await patientRes.json();
            setPatient({
              patient_name: data.patient_name || patientName || 'N/A',
              unique_patient_id: data.unique_patient_id || patientId,
              patient_excel_id: data.patient_excel_id || patientId,
              age: data.age || 'N/A',
              gender: data.gender || 'N/A',
              phone: data.contact_number || 'N/A'
            });
          } else {
            setPatient({
              patient_name: patientName,
              unique_patient_id: patientId,
              patient_excel_id: patientId,
              age: 'N/A',
              gender: 'N/A',
              phone: 'N/A'
            });
          }
        }

        // ✅ Fetch doctor information
        const doctorRes = await fetch('http://127.0.0.1:8000/api/technician/doctors/');
        if (doctorRes.ok) {
          const doctors = await doctorRes.json();
          const selectedDoctor = Array.isArray(doctors) ? doctors[0] : doctors;
          setDoctor(selectedDoctor);
        }

      } catch (err) {
        console.error('Init fetch error:', err);
        setError('Failed to fetch consultation or doctor details.');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [patientId, patientName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Prepare submission data - remove empty strings for optional fields
      const submitData = { ...formData, technician_id: technicianId};
      
      // Fields that should remain as-is (required or have default values)
      const requiredFields = [
        'patient_unique_id', 
        'has_medical_conditions', 
        'has_medications', 
        'has_allergies', 
        'fitness_status'
      ];

      // Convert empty strings to empty string (not null) for optional text fields
      // The serializer will handle empty strings appropriately
      Object.keys(submitData).forEach((key) => {
        if (!requiredFields.includes(key)) {
          if (submitData[key] === null || submitData[key] === undefined) {
            submitData[key] = '';
          }
        }
      });

      // Special handling for conditional fields
      if (submitData.has_medical_conditions === 'No') {
        submitData.medical_conditions = '';
      }
      if (submitData.has_medications === 'No') {
        submitData.medications = '';
      }
      if (submitData.has_allergies === 'No') {
        submitData.allergies = '';
      }
      if (submitData.fitness_status === 'FIT') {
        submitData.unfit_reason = '';
      }

      console.log("Submitting consultation payload:", submitData);

      // 1. Submit or Update Doctor Consultation Data
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `${API_BASE_URL}${existingConsultationId}/` : API_BASE_URL;

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        
        // Handle validation errors
        if (errorData.patient_unique_id) {
          throw new Error(errorData.patient_unique_id[0] || errorData.patient_unique_id);
        }
        if (errorData.doctor) {
          throw new Error(errorData.doctor[0] || errorData.doctor);
        }
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }
        if (errorData.message) {
          throw new Error(errorData.message);
        }
        
        throw new Error('Failed to submit consultation');
      }

      const result = await response.json();
      console.log(`✅ Doctor consultation ${isEditing ? 'updated' : 'created'} successfully:`, result);

      // 2. Mark Service as Completed (if serviceId and technicianId are provided)
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
          const completeData = await completeRes.json();
          throw new Error(completeData?.message || "Failed to mark service as completed");
        }

        console.log("✅ Service marked as completed");
      }

      setSuccess(true);
      
      // Navigate back after successful submission
      setTimeout(() => {
        navigate(-1);
      }, 2000);

    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Error state for missing patient information
  if (!patientId || !patientName) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
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

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-center">
          <div className="mb-4">
            <div className="h-10 w-10 mx-auto rounded-full border-b-2 border-blue-600 animate-spin"></div>
          </div>
          <p>Loading doctor consultation form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isEditing ? 'Edit Doctor Consultation' : 'Doctor Consultation Form'}
              </h1>
              <p className="text-gray-600">
                Patient: {patient?.patient_name || patientName} | ID: {patientId}
                {technicianId && (
                  <span className="ml-4 text-sm text-gray-500">
                    Technician ID: {technicianId}
                  </span>
                )}
                {serviceId && (
                  <span className="ml-4 text-sm text-gray-500">
                    Service ID: {serviceId}
                  </span>
                )}
              </p>
            </div>
            <button 
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <CheckCircle className="text-green-600" size={20} />
            <span className="text-green-800">
              Consultation {isEditing ? 'updated' : 'submitted'} successfully!
              {serviceId && " Service marked as completed."}
            </span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
            <XCircle className="text-red-600" size={20} />
            <span className="text-red-800">{error}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="text-blue-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Patient Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">{patient?.patient_excel_id || patient?.patient_id || patientId || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">{patient?.patient_name || patientName || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">{patient?.age || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">{patient?.gender || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">{patient?.phone || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Unique Patient ID</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">{patient?.unique_patient_id || patientId || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="text-green-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Medical History</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Do you have any existing medical conditions?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_medical_conditions"
                      value="Yes"
                      checked={formData.has_medical_conditions === 'Yes'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_medical_conditions"
                      value="No"
                      checked={formData.has_medical_conditions === 'No'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">If yes, please specify:</label>
                <input
                  type="text"
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={formData.has_medical_conditions === 'No'}
                  placeholder="Specify medical conditions..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Are you currently taking any medications?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_medications"
                      value="Yes"
                      checked={formData.has_medications === 'Yes'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_medications"
                      value="No"
                      checked={formData.has_medications === 'No'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">If yes, please specify:</label>
                <input
                  type="text"
                  name="medications"
                  value={formData.medications}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={formData.has_medications === 'No'}
                  placeholder="Specify current medications..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Do you have any allergies?</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_allergies"
                      value="Yes"
                      checked={formData.has_allergies === 'Yes'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="has_allergies"
                      value="No"
                      checked={formData.has_allergies === 'No'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">If yes, please specify:</label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={formData.has_allergies === 'No'}
                  placeholder="Specify allergies..."
                />
              </div>
            </div>
          </div>

          {/* Consultation Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <Stethoscope className="text-purple-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Consultation Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint:</label>
                <textarea
                  name="chief_complaint"
                  value={formData.chief_complaint}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe the main complaint or symptoms..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">History (Family/Own):</label>
                <textarea
                  name="history"
                  value={formData.history}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Relevant medical history..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnostic Tests Recommended:</label>
                <textarea
                  name="diagnostic_tests"
                  value={formData.diagnostic_tests}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Recommended tests and investigations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Advice (Tests/Medicine):</label>
                <textarea
                  name="advice"
                  value={formData.advice}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Medical advice, prescriptions, recommendations..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Medical Fitness Status:</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fitness_status"
                      value="FIT"
                      checked={formData.fitness_status === 'FIT'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    FIT
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="fitness_status"
                      value="UNFIT"
                      checked={formData.fitness_status === 'UNFIT'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    UNFIT
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">If UNFIT, please specify reason:</label>
                <textarea
                  name="unfit_reason"
                  value={formData.unfit_reason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={formData.fitness_status === 'FIT'}
                  placeholder="Reason for unfitness..."
                />
              </div>
            </div>
          </div>

          {/* Doctor Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="text-indigo-600" size={20} />
              <h2 className="text-xl font-semibold text-gray-900">Doctor's Details</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name:</label>
                <p className="text-gray-900 bg-gray-50 p-2 rounded border">{doctor?.name || 'Dr. [Name to be filled]'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Designation:</label>
                <div className="text-gray-900 bg-gray-50 p-2 rounded border">
                  {doctor?.designation ? 
                    (typeof doctor.designation === 'string' ? 
                      doctor.designation.split('<br>').map((line, index) => (
                        <div key={index}>{line}</div>
                      )) : 
                      doctor.designation
                    ) : 
                    'Medical Officer'
                  }
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Signature:</label>
                <div className="border rounded-lg p-4 bg-gray-50 min-h-[80px] flex items-center justify-center">
                  {doctor?.signature ? (
                    <img 
                      src={doctor.signature} 
                      alt="Doctor Signature" 
                      className="h-16 max-w-full object-contain"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <p className={`text-gray-500 text-sm ${doctor?.signature ? 'hidden' : 'block'}`}>
                    {doctor?.signature ? 'Signature not available' : 'Digital signature will be added here'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-center">
              <button
                onClick={handleSubmit}
                disabled={loading || !formData.patient_unique_id}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                {loading ? (isEditing ? 'Updating...' : 'Submitting...') : (isEditing ? 'Update Consultation' : 'Submit Consultation')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorConsultationForm;