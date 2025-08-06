import React, { useState, useEffect } from 'react';
import { Users, Stethoscope, TestTube, DollarSign, UserCheck, Activity, Eye, Ear, User, Plus, Edit, Trash2, Save, X } from 'lucide-react';

const AdminDashboard = () => {
  const [data, setData] = useState({
    clients: [],
    services: [],
    testCaseData: [],
    copyPrices: [],
    technicians: [],
    doctors: [],
    dentists: [],
    optometrists: [],
    audiometrists: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentItem, setCurrentItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [signatureFile, setSignatureFile] = useState(null);
  const [camps, setCamps] = useState([]);

  // API Base URL
  const API_BASE_URL = 'http://127.0.0.1:8000';

  const endpoints = [
    { key: 'clients', url: '/api/clients/', icon: Users, name: 'Clients', method: 'GET, POST' },
    { key: 'services', url: '/api/services/', icon: Stethoscope, name: 'Services', method: 'GET, POST' },
    { key: 'testCaseData', url: '/api/test-case-data/', icon: TestTube, name: 'Test Cases', method: 'GET, POST' },
    { key: 'copyPrices', url: '/api/copyprice/', icon: DollarSign, name: 'Copy Prices', method: 'GET, POST' },
    { key: 'technicians', url: '/api/technician/technicians/', icon: UserCheck, name: 'Technicians', method: 'GET, POST' },
    { key: 'doctors', url: '/api/technician/doctors/', icon: Activity, name: 'Doctors', method: 'GET, POST' },
    { key: 'dentists', url: '/api/technician/dentists/', icon: User, name: 'Dentists', method: 'GET, POST' },
    { key: 'optometrists', url: '/api/technician/optometrists/', icon: Eye, name: 'Optometrists', method: 'GET, POST' },
    { key: 'audiometrists', url: '/api/technician/audiometrists/', icon: Ear, name: 'Audiometrists', method: 'GET, POST' }
  ];
  


  const filteredCamps = camps.filter(camp => camp.ready_to_go === true);
  console.log('Filtered Camps:', filteredCamps);
  const filteredUsers = data.clients.filter(client => client.login_type.toLowerCase() !== 'client');


  // Form field configurations
  const formConfigs = {
    clients: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'contact_number', label: 'Contact Number', type: 'tel', required: true },
      { key: 'login_type', label: 'Login Type', type: 'select', options: ['Client', 'Doctor','Dentist','Optometrist','Audiometrist','Technician'], required: true },
      { key: 'password', label: 'Password', type: 'password', required: true }
    ],
    services: [
      { key: 'name', label: 'Service Name', type: 'text', required: true },
      { key: 'price_ranges', label: 'Price Ranges', type: 'json', required: true }
    ],
    testCaseData: [
      { key: 'service_name', label: 'Service Name', type: 'text', required: true },
      { key: 'case_per_day', label: 'Cases Per Day', type: 'number', required: true },
      { key: 'number_of_days', label: 'Number of Days', type: 'number', required: true },
      { key: 'total_case', label: 'Total Cases', type: 'number', required: true }
    ],
    copyPrices: [
      { key: 'name', label: 'Service Name', type: 'text', required: true },
      { key: 'hard_copy_price', label: 'Hard Copy Price', type: 'number', step: '0.01', required: true }
    ],
    technicians: [
       { 
           key: 'user', 
           label: 'User', 
           type: 'select', 
           options: filteredUsers,
           optionLabel: 'name', 
           optionValue: 'id',
           required: true 
         },
         { 
           key: 'camps', 
           label: 'Camps', 
           type: 'multi-select',   // a new type for multiple selections
           options: filteredCamps,
           optionLabel: 'location',
           optionValue: 'id',
           required: true
         },
         { 
           key: 'services', 
           label: 'Services', 
           type: 'multi-select',
           options: data.services,
           optionLabel: 'name',
           optionValue: 'id',
           required: true
         }
    ],
    doctors: [
      { 
        key: 'user', 
        label: 'User', 
        type: 'select', 
        options: [], 
        optionLabel: 'name', 
        optionValue: 'id',
        required: true 
      },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'textarea', required: true },
      { key: 'signature', label: 'Signature', type: 'file', required: false }
    ],
    dentists: [
      { 
        key: 'user', 
        label: 'User', 
        type: 'select', 
        options: [], 
        optionLabel: 'name', 
        optionValue: 'id',
        required: true 
      },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'signature', label: 'Signature', type: 'file', required: false }
    ],
    optometrists: [
      { 
        key: 'user', 
        label: 'User', 
        type: 'select', 
        options: [], 
        optionLabel: 'name', 
        optionValue: 'id',
        required: true 
      },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'signature', label: 'Signature', type: 'file', required: false }
    ],
    audiometrists: [
      { 
        key: 'user', 
        label: 'User', 
        type: 'select', 
        options: [], 
        optionLabel: 'name', 
        optionValue: 'id',
        required: true 
      },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'signature', label: 'Signature', type: 'file', required: false }
    ]
  };


  const fetchCamps = async () => {
   try {
     const response = await fetch(`${API_BASE_URL}/api/campmanager/camps/`);
     if (response.ok) {
       const result = await response.json();
       setCamps(result);
     } else {
       setCamps([]);
       console.error('Failed to fetch Camps');
     }
   } catch (error) {
     setCamps([]);
     console.error('Error fetching Camps:', error);
   }
 };

//   useEffect(() => {
//     fetchAllData();
//   }, []);

  useEffect(() => {
    fetchAllData();
    fetchCamps();
  }, []);

  useEffect(() => {
    // Update dropdown options for professional forms when clients data changes
    if (data.clients.length > 0) {
      const professionalForms = ['technicians', 'doctors', 'dentists', 'optometrists', 'audiometrists'];
      
      professionalForms.forEach(formKey => {
        const field = formConfigs[formKey].find(f => f.key === 'user');
        if (field) {
          field.options = data.clients.filter(client => 
            client.login_type.toLowerCase() === formKey.slice(0, -1) || 
            (formKey === 'technicians' && client.login_type === 'Technician')
          );
        }
      });
    }
  }, [data.clients]);

  const fetchAllData = async () => {
    setLoading(true);
    const newData = {};

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint.url}`);
        if (response.ok) {
          const result = await response.json();
          newData[endpoint.key] = Array.isArray(result) ? result : [result];
        } else {
          newData[endpoint.key] = [];
          console.error(`Failed to fetch ${endpoint.name}:`, response.statusText);
        }
      } catch (error) {
        newData[endpoint.key] = [];
        console.error(`Error fetching ${endpoint.name}:`, error);
      }
    }

    setData(newData);
    setLoading(false);
  };

const handleAdd = (endpointKey) => {
  setModalMode('add');
  setCurrentItem(null);
  
  if (endpointKey === 'technicians' || endpointKey === 'doctors' || endpointKey === 'dentists' || endpointKey === 'optometrists' || endpointKey === 'audiometrists') {
    setFormData({
      user: '',
      camps: [],
      services: []
    });
  } else {
    setFormData({});
  }
  
  setSignatureFile(null);
  setActiveTab(endpointKey);
  setShowModal(true);
};

const handleEdit = (item, endpointKey) => {
  setModalMode('edit');
  setCurrentItem(item);

  if (endpointKey === 'technicians' || endpointKey === 'doctors' || endpointKey === 'dentists' || endpointKey === 'optometrists' || endpointKey === 'audiometrists') {
    setFormData({
      ...item, 
      camps: item.camps ? (Array.isArray(item.camps) ? item.camps.map(c => c.id || c) : [item.camps.id || item.camps]) : [],
      services: item.services ? (Array.isArray(item.services) ? item.services.map(s => s.id || s) : [item.services.id || item.services]) : [],
      user: item.user ? item.user.id || item.user : ''
    });
  } else {
    setFormData(item);
  }
  
  setSignatureFile(null);
  setActiveTab(endpointKey);
  setShowModal(true);
};

  const handleDelete = async (item, endpointKey) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const endpoint = endpoints.find(e => e.key === endpointKey);
      const response = await fetch(`${API_BASE_URL}${endpoint.url}${item.id}/`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchAllData();
        alert('Item deleted successfully!');
      } else {
        alert('Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const config = formConfigs[activeTab];
    const missingFields = [];
    


    for (const field of config) {
      if (field.required) {
        const value = formData[field.key];
        if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
          missingFields.push(field.label);
        }
      }
    }
    
    if (missingFields.length > 0) {
      alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
      return;
    }
    
    try {
      const endpoint = endpoints.find(e => e.key === activeTab);
      const url = modalMode === 'add' 
        ? `${API_BASE_URL}${endpoint.url}`
        : `${API_BASE_URL}${endpoint.url}${currentItem.id}/`;
      
      const method = modalMode === 'add' ? 'POST' : 'PUT';

      let submitData = { ...formData };
      if (activeTab === 'technicians') {
        submitData = {
          ...submitData,
          user: parseInt(submitData.user), // Convert to integer
          camps: Array.isArray(submitData.camps) ? submitData.camps : [submitData.camps],
          services: Array.isArray(submitData.services) ? submitData.services : [submitData.services]
        };
      }
      
      // Handle signature upload separately
      const formHasSignature = formConfigs[activeTab].some(field => field.key === 'signature');
      const formHasFile = signatureFile || formHasSignature;
      
      if (formHasFile) {
        const formDataObj = new FormData();
        
        // Add all form data
        for (const key in formData) {
          if (key !== 'signature') {
            formDataObj.append(key, formData[key]);
          }
        }
        
        // Add signature file if exists
        if (signatureFile) {
          formDataObj.append('signature', signatureFile);
        }
        
        const response = await fetch(url, {
          method,
          body: formDataObj
        });

        if (response.ok) {
          setShowModal(false);
          fetchAllData();
          alert(`Item ${modalMode === 'add' ? 'added' : 'updated'} successfully!`);
        } else {
          const errorData = await response.json();
          alert(`Failed to ${modalMode} item: ${JSON.stringify(errorData)}`);
        }
      } else {
        // Regular JSON request
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData), 
        });

        if (response.ok) {
          setShowModal(false);
          fetchAllData();
          alert(`Item ${modalMode === 'add' ? 'added' : 'updated'} successfully!`);
        } else {
          const errorData = await response.json();
          alert(`Failed to ${modalMode} item: ${JSON.stringify(errorData)}`);
        }
      }
    } catch (error) {
      console.error(`Error ${modalMode}ing item:`, error);
      alert(`Error ${modalMode}ing item`);
    }
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFileChange = (key, file) => {
    setSignatureFile(file);
  };

  const renderFormField = (field) => {
    const value = formData[field.key] || '';

    switch (field.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options && field.options.map(option => (
              <option 
                key={field.optionValue ? option[field.optionValue] : option} 
                value={field.optionValue ? option[field.optionValue] : option}
              >
                {field.optionLabel ? option[field.optionLabel] : option}
              </option>
            ))}
          </select>
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            required={field.required}
          />
        );
      case 'json':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleInputChange(field.key, parsed);
              } catch {
                handleInputChange(field.key, e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            rows="5"
            placeholder="Enter valid JSON"
            required={field.required}
          />
        );
      case 'file':
        return (
          <div>
            {modalMode === 'edit' && value && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Current Signature:</p>
                <img 
                  src={value} 
                  alt="Current signature" 
                  className="max-h-20 border rounded p-1"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(field.key, e.target.files[0])}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Upload signature image (PNG, JPG)</p>
          </div>
        );

        case 'multi-select':
          return (
            <select
              multiple
              value={Array.isArray(value) ? value.map(v => String(v)) : []}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions).map(option => 
                  field.optionValue ? parseInt(option.value) : option.value
                );
                handleInputChange(field.key, selectedOptions);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={field.required}
            >
              {field.options && field.options.map(option => (
                <option
                  key={field.optionValue ? option[field.optionValue] : option}
                  value={field.optionValue ? option[field.optionValue] : option}
                >
                  {field.optionLabel ? option[field.optionLabel] : option}
                </option>
              ))}
            </select>
          );
        
      default:
        return (
          <input
            type={field.type}
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            step={field.step}
            required={field.required}
          />
        );
    }
  };

  const renderModal = () => {
    if (!showModal) return null;

    const config = formConfigs[activeTab];
    if (!config) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {modalMode === 'add' ? 'Add' : 'Edit'} {endpoints.find(e => e.key === activeTab)?.name}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {config.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {renderFormField(field)}
              </div>
            ))}
            
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {modalMode === 'add' ? 'Add' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {endpoints.map((endpoint) => {
        const Icon = endpoint.icon;
        const count = data[endpoint.key]?.length || 0;
        return (
          <div key={endpoint.key} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{endpoint.name}</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{count}</p>
                <p className="text-sm text-gray-500 mt-1">{endpoint.method}</p>
              </div>
              <Icon className="h-12 w-12 text-blue-500" />
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                onClick={() => setActiveTab(endpoint.key)}
                className="flex-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                View Details →
              </button>
              {endpoint.method.includes('POST') && (
                <button
                  onClick={() => handleAdd(endpoint.key)}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderTable = (dataArray, title, endpointKey) => {
    const endpoint = endpoints.find(e => e.key === endpointKey);
    const canEdit = endpoint?.method.includes('POST');

    if (!dataArray || dataArray.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            {canEdit && (
              <button
                onClick={() => handleAdd(endpointKey)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </button>
            )}
          </div>
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    const firstItem = dataArray[0];
    const columns = Object.keys(firstItem).filter(col => 
      !['signature', 'user', 'technician'].includes(col)
    );

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {canEdit && (
            <button
              onClick={() => handleAdd(endpointKey)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {column.replace(/_/g, ' ')}
                  </th>
                ))}
                {canEdit && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataArray.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renderCellValue(item[column])}
                    </td>
                  ))}
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item, endpointKey)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item, endpointKey)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTechniciansTable = (dataArray, title, endpointKey) => {
    const endpoint = endpoints.find(e => e.key === endpointKey);
    const canEdit = endpoint?.method.includes('POST');

    if (!dataArray || dataArray.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            {canEdit && (
              <button
                onClick={() => handleAdd(endpointKey)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New
              </button>
            )}
          </div>
          <p className="text-gray-500">No technicians available</p>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {canEdit && (
            <button
              onClick={() => handleAdd(endpointKey)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Camps</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services</th>
                {canEdit && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dataArray.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.user ? (
                      <div>
                        <div className="font-medium">{item.user.name}</div>
                        <div className="text-gray-500">{item.user.email}</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.camps ? (
                      Array.isArray(item.camps) ? (
                        item.camps.map(camp => camp.name).join(', ')
                      ) : item.camps.name
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.services ? (
                      Array.isArray(item.services) ? (
                        item.services.map(service => service.name).join(', ')
                      ) : item.services.name
                    ) : '-'}
                  </td>
                  {canEdit && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item, endpointKey)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item, endpointKey)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCellValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      // Handle nested objects for medical professionals
      if (value.name) return value.name;
      if (value.email) return value.email;
      return JSON.stringify(value);
    }
    if (typeof value === 'string' && value.includes('http')) {
      return (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          View Signature
        </a>
      );
    }
    return value.toString();
  };

  const renderServicePricing = () => {
    const endpointKey = 'services';
    const canEdit = endpoints.find(e => e.key === endpointKey)?.method.includes('POST');

    if (!data.services || data.services.length === 0) {
      return renderTable([], 'Services', endpointKey);
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Services with Pricing</h2>
          {canEdit && (
            <button
              onClick={() => handleAdd(endpointKey)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Service
            </button>
          )}
        </div>
        <div className="p-6 space-y-6">
          {data.services.map((service) => (
            <div key={service.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                {canEdit && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(service, endpointKey)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service, endpointKey)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {service.price_ranges?.map((range, index) => (
                  <div key={index} className="bg-blue-50 rounded p-3 text-center">
                    <div className="text-sm text-gray-600">Up to {range.max_cases} cases</div>
                    <div className="text-lg font-bold text-blue-600">₹{range.price}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'services':
        return renderServicePricing();
      case 'clients':
        return renderTable(data.clients, 'Clients / Customers', 'clients');
      case 'testCaseData':
        return renderTable(data.testCaseData, 'Test Case Data', 'testCaseData');
      case 'copyPrices':
        return renderTable(data.copyPrices, 'Copy Prices', 'copyPrices');
      case 'technicians':
        return renderTechniciansTable(data.technicians, 'Technician Staff', 'technicians');
      case 'doctors':
        return renderTable(data.doctors, 'Doctors', 'doctors');
      case 'dentists':
        return renderTable(data.dentists, 'Dentists', 'dentists');
      case 'optometrists':
        return renderTable(data.optometrists, 'Optometrists', 'optometrists');
      case 'audiometrists':
        return renderTable(data.audiometrists, 'Audiometrists', 'audiometrists');
      default:
        return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            {endpoints.map((endpoint) => (
              <button
                key={endpoint.key}
                onClick={() => setActiveTab(endpoint.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === endpoint.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {endpoint.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  );
};

export default AdminDashboard;