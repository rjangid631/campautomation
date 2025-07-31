// src/components/PatientStatus.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  Search,
  Filter,
  Phone,
  User,
  Calendar,
  Building,
  ChevronDown,
  ChevronRight,
  Eye,
  UserCheck,
  Activity,
  Grid3X3,
  List,
  LayoutGrid
} from 'lucide-react';
import api from './api';

const colors = {
  aqua: '#0cc0df',
  green: '#7ed957',
  darkGrey: '#3c3b3f',
  purple: '#944cdd'
};

// Define the standard service columns that should appear in the matrix
const SERVICE_COLUMNS = [
  'Registration',
  'XRAY', 
  'ECG',
  'PFT',
  'AUDIO',
  'OPTO',
  'VITALS',
  'PATHOLOGY',
  'Dr Consultation'
];

function PatientStatus({ onBack }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedPatient, setExpandedPatient] = useState(null);
  const [viewMode, setViewMode] = useState('table');

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/campmanager/all-patients-with-services/');

      if (response.data && response.data.patients && Array.isArray(response.data.patients)) {
        setPatients(response.data.patients);
      } else if (Array.isArray(response.data)) {
        setPatients(response.data);
      } else {
        console.error('Invalid API response structure:', response.data);
        setError('Invalid data format received from server');
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setError('Failed to fetch patient data');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const getServiceCompletionStats = (services) => {
    if (!services || services.length === 0) return { completed: 0, total: 0, percentage: 0 };
    const completed = services.filter(service => service.is_completed).length;
    return {
      completed,
      total: services.length,
      percentage: services.length > 0 ? Math.round((completed / services.length) * 100) : 0
    };
  };

  // Function to get service status for matrix display
  const getServiceStatus = (patient, serviceName) => {

    // Special handling for Registration - if patient is checked in, registration is done
    if (serviceName === 'Registration') {
      return {
        service_name: 'Registration',
        is_completed: patient.checked_in || false,
        technician_name: patient.checked_in ? 'Front Desk' : null,
        last_updated: patient.checked_in ? new Date().toISOString() : null
      };
    }

    if (!patient.services || patient.services.length === 0) return null;
    
    // Try to find exact match first
    let service = patient.services.find(s => 
      s.service_name?.toLowerCase() === serviceName.toLowerCase()
    );
    
    // If not found, try partial matches for common variations
    if (!service) {
      const searchTerms = {
        'Registration': ['registration', 'reg'],
        'XRAY': ['xray', 'x-ray', 'radiography', 'chest x-ray'],
        'ECG': ['ecg', 'ekg', 'electrocardiogram'],
        'PFT': ['pft', 'pulmonary function', 'spirometry'],
        'AUDIO': ['audio', 'audiometry', 'hearing'],
        'OPTO': ['opto', 'optometry', 'vision', 'eye'],
        'VITALS': ['vitals', 'vital signs', 'bp', 'blood pressure'],
        'PATHOLOGY': ['pathology', 'lab', 'blood test'],
        'Dr Consultation': ['doctor', 'consultation', 'physician', 'medical']
      };
      
      const terms = searchTerms[serviceName] || [serviceName.toLowerCase()];
      service = patient.services.find(s => 
        terms.some(term => s.service_name?.toLowerCase().includes(term))
      );
    }
    
    return service;
  };

  const filteredPatients = Array.isArray(patients) ? patients.filter(patient => {
    const matchesSearch = patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         patient.patient_excel_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'checked-in' && patient.checked_in) ||
                         (filterStatus === 'not-checked-in' && !patient.checked_in);
    
    return matchesSearch && matchesFilter;
  }) : [];

  const getTotalStats = () => {
    if (!Array.isArray(patients)) {
      return {
        total: 0,
        checkedIn: 0,
        totalServices: 0,
        completedServices: 0,
        serviceCompletionRate: 0
      };
    }

    const checkedIn = patients.filter(p => p.checked_in).length;
    const totalServices = patients.reduce((sum, p) => sum + (p.services?.length || 0), 0);
    const completedServices = patients.reduce((sum, p) => 
      sum + (p.services?.filter(s => s.is_completed).length || 0), 0);
    
    return {
      total: patients.length,
      checkedIn,
      totalServices,
      completedServices,
      serviceCompletionRate: totalServices > 0 ? Math.round((completedServices / totalServices) * 100) : 0
    };
  };

  const stats = getTotalStats();

  const togglePatientExpansion = (patientId) => {
    setExpandedPatient(expandedPatient === patientId ? null : patientId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: colors.aqua }}></div>
          <p className="text-gray-600">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="text-center">
          <XCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={fetchPatientData}
              className="px-4 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: colors.aqua }}
            >
              Retry
            </button>
            <button
              onClick={onBack}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <div className="px-6 py-4 shadow-sm" style={{ backgroundColor: colors.darkGrey }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Patient Status Dashboard</h1>
              <p className="text-gray-300 flex items-center gap-2 mt-1">
                <Users size={16} />
                All Patients & Service Status
              </p>
            </div>
          </div>
          <div className="text-right text-white">
            <p className="text-sm opacity-75">Last updated</p>
            <p className="font-semibold">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value={stats.total}
            icon={<Users size={24} />}
            color={colors.aqua}
            subtitle="All registered patients"
          />
          <StatCard
            title="Checked In"
            value={stats.checkedIn}
            icon={<CheckCircle size={24} />}
            color={colors.green}
            subtitle="Present at camp"
          />
          <StatCard
            title="Service Progress"
            value={`${stats.completedServices}/${stats.totalServices}`}
            icon={<Clock size={24} />}
            color={colors.purple}
            subtitle={`${stats.serviceCompletionRate}% completed`}
          />
          <StatCard
            title="Not Checked In"
            value={stats.total - stats.checkedIn}
            icon={<XCircle size={24} />}
            color={colors.darkGrey}
            subtitle="Absent patients"
          />
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name or patient ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ focusRingColor: colors.aqua }}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2"
                style={{ focusRingColor: colors.aqua }}
              >
                <option value="all">All Patients</option>
                <option value="checked-in">Checked In</option>
                <option value="not-checked-in">Not Checked In</option>
              </select>
            </div>
          </div>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">View:</span>
            <div className="flex items-center bg-white rounded-lg shadow-sm border">
              <button
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'table' 
                    ? 'text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ 
                  backgroundColor: viewMode === 'table' ? colors.aqua : 'transparent'
                }}
              >
                <List size={18} />
                Table View
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'card' 
                    ? 'text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={{ 
                  backgroundColor: viewMode === 'card' ? colors.aqua : 'transparent'
                }}
              >
                <LayoutGrid size={18} />
                Service Matrix
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Showing {filteredPatients.length} of {patients.length} patients
          </div>
        </div>

        {/* Conditional Rendering based on View Mode */}
        {viewMode === 'table' ? (
          /* Table View */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 border-b">
                      Patient Details
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 border-b">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 border-b">
                      Services Progress
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 border-b">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 border-b">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient, index) => {
                    const serviceStats = getServiceCompletionStats(patient.services);
                    const isExpanded = expandedPatient === patient.unique_patient_id;
                    
                    return (
                      <React.Fragment key={patient.unique_patient_id}>
                        {/* Main Patient Row */}
                        <tr 
                          className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" 
                                   style={{ backgroundColor: colors.aqua }}>
                                {patient.name?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{patient.name || 'Unknown Name'}</div>
                                <div className="text-sm text-gray-500">ID: {patient.patient_excel_id || 'N/A'}</div>
                                <div className="text-sm text-gray-500">{patient.age || 'N/A'} years, {patient.gender || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4">
                            {patient.checked_in ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white" 
                                    style={{ backgroundColor: colors.green }}>
                                <UserCheck size={14} />
                                Checked In
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium text-white" 
                                    style={{ backgroundColor: colors.darkGrey }}>
                                <XCircle size={14} />
                                Not Checked In
                              </span>
                            )}
                          </td>
                          
                          <td className="px-6 py-4">
                            {patient.services && patient.services.length > 0 ? (
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="h-2 rounded-full transition-all duration-300"
                                      style={{ 
                                        width: `${serviceStats.percentage}%`,
                                        backgroundColor: colors.purple 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                                <span className="text-sm font-medium" style={{ color: colors.purple }}>
                                  {serviceStats.completed}/{serviceStats.total}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No services</span>
                            )}
                          </td>
                          
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Phone size={14} />
                                {patient.contact_number || 'N/A'}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => togglePatientExpansion(patient.unique_patient_id)}
                              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
                              style={{ backgroundColor: colors.aqua }}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronDown size={16} />
                                  Hide Details
                                </>
                              ) : (
                                <>
                                  <Eye size={16} />
                                  View Details
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={5} className="px-6 py-6" style={{ backgroundColor: '#f8fafc' }}>
                              <ExpandedPatientDetails patient={patient} serviceStats={serviceStats} colors={colors} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Service Matrix View */
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 border-b sticky left-0 bg-gray-50 min-w-[200px]">
                      Patient Details
                    </th>
                    {SERVICE_COLUMNS.map((service) => (
                      <th key={service} className="px-3 py-3 text-center text-xs font-semibold text-gray-600 border-b min-w-[80px]">
                        {service}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600 border-b min-w-[100px]">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient, index) => {
                    const serviceStats = getServiceCompletionStats(patient.services);
                    
                    return (
                      <tr 
                        key={patient.unique_patient_id}
                        className={`border-b hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                      >
                        {/* Patient Details - Sticky Column */}
                        <td className="px-4 py-4 sticky left-0 bg-white shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm" 
                                 style={{ backgroundColor: colors.aqua }}>
                              {patient.name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-gray-900 truncate">{patient.name || 'Unknown Name'}</div>
                              <div className="text-xs text-gray-500">ID: {patient.patient_excel_id || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{patient.age || 'N/A'}y, {patient.gender || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        
                        {/* Service Status Columns */}
                        {SERVICE_COLUMNS.map((serviceName) => {
                          const service = getServiceStatus(patient, serviceName);
                          
                          return (
                            <td key={serviceName} className="px-3 py-4 text-center">
                              {service ? (
                                <div className="flex flex-col items-center gap-1">
                                  {service.is_completed ? (
                                    <>
                                      <CheckCircle size={16} style={{ color: colors.green }} />
                                      <span className="text-xs font-medium text-green-600">Done</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock size={16} style={{ color: colors.darkGrey }} />
                                      <span className="text-xs font-medium text-gray-600">Pending</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <XCircle size={16} className="text-gray-300" />
                                  <span className="text-xs text-gray-400">N/A</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                        
                        {/* Progress Column */}
                        <td className="px-4 py-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${serviceStats.percentage}%`,
                                  backgroundColor: colors.purple 
                                }}
                              ></div>
                            </div>
                            <span className="text-xs font-medium" style={{ color: colors.purple }}>
                              {serviceStats.completed}/{serviceStats.total}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredPatients.length === 0 && !loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No patients found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Reusable component for expanded patient details (unchanged)
const ExpandedPatientDetails = ({ patient, serviceStats, colors }) => (
  <div className="space-y-6">
    {/* Patient Information */}
    <div>
      <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.darkGrey }}>
        <User size={18} />
        Patient Information
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-lg p-4">
        <div>
          <span className="text-sm font-medium text-gray-600">Full Name:</span>
          <p className="text-gray-900">{patient.name || 'N/A'}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Patient ID:</span>
          <p className="text-gray-900">{patient.patient_excel_id || 'N/A'}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Unique ID:</span>
          <p className="text-gray-900 font-mono text-sm">{patient.unique_patient_id}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Age:</span>
          <p className="text-gray-900">{patient.age || 'N/A'} years</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Gender:</span>
          <p className="text-gray-900">{patient.gender || 'N/A'}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-gray-600">Contact Number:</span>
          <p className="text-gray-900">{patient.contact_number || 'N/A'}</p>
        </div>
        {patient.package && (
          <div>
            <span className="text-sm font-medium text-gray-600">Package:</span>
            <p className="text-gray-900">{patient.package}</p>
          </div>
        )}
      </div>
    </div>

    {/* Services Details */}
    {patient.services && patient.services.length > 0 ? (
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2" style={{ color: colors.darkGrey }}>
          <Activity size={18} />
          Service Details ({serviceStats.completed}/{serviceStats.total} Completed)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {patient.services.map((service, idx) => (
            <div key={idx} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">{service.service_name || 'Unknown Service'}</h5>
                {service.is_completed ? (
                  <CheckCircle size={20} style={{ color: colors.green }} />
                ) : (
                  <Clock size={20} style={{ color: colors.darkGrey }} />
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${service.is_completed ? 'text-green-600' : 'text-gray-600'}`}>
                    {service.is_completed ? 'Completed' : 'Pending'}
                  </span>
                </div>
                
                {service.technician_name && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Technician:</span>
                    <span className="font-medium text-gray-900">{service.technician_name}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="text-gray-900">
                    {service.last_updated ? new Date(service.last_updated).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mt-2">
                  {service.last_updated ? new Date(service.last_updated).toLocaleTimeString() : ''}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="bg-white rounded-lg p-6 text-center">
        <Activity size={48} className="mx-auto mb-4 text-gray-400" />
        <h4 className="font-semibold text-gray-600 mb-2">No Services Assigned</h4>
        <p className="text-gray-500">This patient has no services currently assigned.</p>
      </div>
    )}
  </div>
);

const StatCard = ({ title, value, icon, color, subtitle }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      </div>
      <div className="p-3 rounded-full" style={{ backgroundColor: color + '20', color }}>
        {icon}
      </div>
    </div>
  </div>
);

export default PatientStatus;
