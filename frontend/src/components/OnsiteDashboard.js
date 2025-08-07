import React, { useState, useEffect, useCallback } from 'react';
import html2pdf from "html2pdf.js";
import axios from "axios";
import { onsiteAPI, onsiteUtils } from './api';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from "pdfjs-dist/build/pdf";
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.js';
import QRCode from 'qrcode';



const OnsiteDashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMenuItem, setActiveMenuItem] = useState('dashboard');
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [patients, setPatients] = useState([]);
  const [originalPatients, setOriginalPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [loanFile, setLoanFile] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDetailPatient, setSelectedDetailPatient] = useState(null);



  // Add these new state variables after line 17
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [patientForm, setPatientForm] = useState({
    patient_id: '',
    name: '',
    age: '',
    gender: '',
    phone: '',
    services: '',
    load_number: ''
  });
  const [isSubmittingPatient, setIsSubmittingPatient] = useState(false);



  // Color constants
  const COLORS = {
    white: '#ffffff',
    success: '#16a34a',
    danger: '#dc2626',
    lightGrey: '#f8f9fa',
    mediumGrey: '#e1e5e9',
    darkGrey: '#6c757d',
    lightText: '#8e9aaf',
    mediumText: '#6b7280',
    darkText: '#1f2937',
    aquaBlue: '#17a2b8',
    orange: '#f97316' 
  };





  // Add these new functions
  const handleAddPatientClick = (e, packageItem) => {
    e.stopPropagation(); // Prevent package selection
    setShowAddPatientModal(true);
  };

// for addd patient modal
const handlePhotoChange = (e) => {
  setPhotoFile(e.target.files[0]);
};

GlobalWorkerOptions.workerSrc = pdfjsWorker;

const convertBase64PdfToImage = async (base64) => {
  const pdfData = atob(base64);
  const uint8Array = new Uint8Array([...pdfData].map(char => char.charCodeAt(0)));
  const loadingTask = getDocument({ data: uint8Array });

  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(1);

  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext("2d");
  await page.render({ canvasContext: context, viewport }).promise;

  return canvas.toDataURL("image/png");
};


const generateQRCodeBase64 = async (patient) => {
  const patientInfo = `Patient ID: ${patient.unique_patient_id}
  Name: ${patient.name}
  Age: ${patient.age}
  Gender: ${patient.gender}`;

  try {
    console.log("Generating QR Code for:", patientInfo);
    
    // Check if QRCode library exists
    if (typeof QRCode === 'undefined') {
      throw new Error("QRCode library not loaded");
    }
    
    const qrCode = await QRCode.toDataURL(patientInfo, {
      width: 120,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    console.log("QR Code generated successfully");
    return qrCode;
  } catch (err) {
    console.error("QR generation error:", err);
    // Return a placeholder or throw the error instead of empty string
    throw err;
  }
};

const handleSmartReportGenerate = async (patient) => {
  try {
    // 1. Get full smart report data
    const { data } = await axios.get(`http://127.0.0.1:8000/api/technician/smart-report/${patient.unique_patient_id}/`);
    const { patient: p, vitals, pathology, bmr_pdf_base64 } = data;
    console.log("Smart Report Data:", data);

    // 2. Create temporary div for 3-page PDF
    const container = document.createElement("div");

        // Helper function to safely get values with fallbacks
    const getValue = (value, fallback = 'N/A', unit = '') => {
      if (value === null || value === undefined || value === '') return fallback;
      return `${value}${unit}`;
    };

    // Helper function to determine if value is in normal range
    const getValueStatus = (value, min, max) => {
      if (value === null || value === undefined || value === '') return '';
      const numValue = parseFloat(value);
      if (numValue < min) return 'Low';
      if (numValue > max) return 'High';
      return 'Normal';
    };
    

    // ----------- PAGE 1: PATIENT DETAILS WITH LOGO AND QR CODE -----------
    const photoBase64 = `data:image/webp;base64,${p.photo_base64}`;
    const qrCodeBase64 = await generateQRCodeBase64(p); 
    const page1 = document.createElement("div");
    page1.style.pageBreakAfter = "always";
    page1.innerHTML = `
      <div style="
    width: 794px; 
    height: 900px; 
    padding: 40px; 
    font-family: Arial, sans-serif; 
    box-sizing: border-box; 
    position: relative;
    border: 0px solid #000;
    margin: auto;
  ">

    <!-- Header -->
    <div style="display: flex; align-items: center; margin-bottom: 30px;">
      <img src="./campanylogo.jpeg" alt="Company Logo" style="height: 80px;">
      <h1 style="margin-left: 20px; font-size: 28px;"></h1>
    </div>

    <!-- Profile Image -->
    <div style="display: flex; justify-content: center; margin-bottom: 40px;">
      <div style="width: 220px; height: 220px; border-radius: 50%; overflow: hidden; border: 4px solid #4285F4;">
        <img src="${photoBase64}" alt="Profile Photo" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
    </div>

    <!-- Patient Details + QR Code -->
    <div style="display: flex; justify-content: space-between; margin-top: 40px;">

      <!-- Patient Table -->
      <table style="border-collapse: collapse; font-size: 16px; width: 60%;">
        <tr>
          <td style="padding: 10px; border: 1px solid #000; background-color: #f0f0f0; font-weight: bold;">Patient Name</td>
          <td style="padding: 10px; border: 1px solid #000;">${p.name || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000; background-color: #f0f0f0; font-weight: bold;">Gender</td>
          <td style="padding: 10px; border: 1px solid #000;">${p.gender || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000; background-color: #f0f0f0; font-weight: bold;">Age</td>
          <td style="padding: 10px; border: 1px solid #000;">${p.age || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #000; background-color: #f0f0f0; font-weight: bold;">Height</td>
          <td style="padding: 10px; border: 1px solid #000;">${vitals?.height ? vitals.height + ' cm' : 'N/A'}</td>
        </tr>
      </table>

      <!-- QR Code -->
      <div style="text-align: center;">
        <p style="margin-bottom: 10px; font-weight: bold;">Scan for Details</p>
        <img src="${qrCodeBase64}" alt="QR Code" style="width: 140px; height: 140px; border: 1px solid #000;">
      </div>
    </div>
  </div>
`;
    container.appendChild(page1);

    // ----------- PAGE 2: BMR PDF IMAGE -----------
    const imageDataUrl = await convertBase64PdfToImage(bmr_pdf_base64);
    
    const page2 = document.createElement("div");
    page2.style.pageBreakAfter = "always";
    page2.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif; min-height: 100vh; text-align: center;">
        <h1 style="margin-bottom: 30px; color: #333;">BMR Report</h1>
        <img src="${imageDataUrl}" 
             style="width: 794px; height: 1000px; padding: 20px; " 
             alt="BMR Report Image">
      </div>
    `;
    container.appendChild(page2);

    // ----------- PAGE 3: HEALTH CHECK-UP REPORT (PATHOLOGY) -----------
    const page3 = document.createElement("div");
page3.innerHTML = `
  <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Health Check-up Report</title>
    <style>
       body {
    margin: 0;
    padding: 20px;
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
}

.report-container {
    max-width: 794px; /* A4 width in px */
    margin: 0 auto;
    border: 4px solid #000;
    background: white;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.header {
    text-align: center;
    padding: 20px;
    background: #f8f8f8;
    border-bottom: 3px solid #000;
}

.header h1 {
    font-size: 26px;
    font-weight: bold;
    letter-spacing: 2px;
    margin: 0;
}

.content-wrapper {
    display: flex;
    height: auto;
    max-height: 1000px; /* under A4 */
    box-sizing: border-box;
}

.left-column, .right-column {
    width: 32%;
    padding: 6px;
}

.center-column {
    width: 36%;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 4px;
}

.section-title {
    font-weight: bold;
    font-size: 13px;
    text-align: center;
    margin-bottom: 6px;
    line-height: 1.2;
}

.cardio-header {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 6px;
    height: 150px;
}



.logo-img {
  width: 100px;
  object-fit: contain; /* maintains aspect ratio */
}

.organ-icon {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    margin-right: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: bold;
}

.test-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 9.5px;
}

.test-table td {
    border: 1px solid #000;
    padding: 4px 2px;
    text-align: center;
    vertical-align: middle;
    line-height: 1.3; /* Added for spacing */
}

.test-table td:first-child {
    text-align: left;
    background: #E8F5E8;
}

.test-header-row {
    background: #4CAF50;
    color: white;
    font-weight: bold;
}

.body-diagram {
    width: 300px;     /* was 160px */
    height:800px;    /* was 260px */
    background: url('...') center/contain no-repeat;
    border: 2px solid #ddd;
    border-radius: 10px;
}

.cardiovascular-section,
.blood-section,
.respiratory-section,
.kidney-section,
.liver-section,
.glucose-section {
    padding: 8px;
    margin-bottom: 10px;
    border-radius: 8px;
}

.cardiovascular-section { background: #FFEBEE; }
.blood-section         { background: #FFEBEE; }
.respiratory-section   { background: #E3F2FD; }
.kidney-section        { background: #E0F2F1; }
.liver-section         { background: #EFEBE9; }
.glucose-section       { background: #FFF3E0; }

    </style>
</head>
<body>
    <div class="report-container">
        <div class="header">
            <h1>HEALTH CHECK-UP REPORT</h1>
            <p style="font-size: 14px; color: #555;">Patient ID: ${p.unique_patient_id}  Name: ${p.name}</p>
        </div>

        <div class="content-wrapper">
            <!-- Left Column -->
            <div class="left-column">
                <!-- Cardiovascular Assessment -->
                <div class="cardiovascular-section">
                    <div class="cardio-header">
                        <div class="logo-container"><img src="./5.png" alt="XRAi Logo"></div>
                        <div class="section-title">CARDIOVASCULAR<br>ASSESSMENT</div>
                    </div>
                    <table class="test-table">
                        <tr class="test-header-row">
                            <td>TEST</td>
                            <td>FINDINGS</td>
                            <td>RANGE</td>
                        </tr>
                        <tr><td>Heart Rate</td><td>${getValue(vitals?.heart_rate, 'N/A', ' beats/min')}</td><td>60 - 100 beats/min</td></tr>
                        <tr><td>Blood Pressure</td><td>${getValue(vitals?.bp, 'N/A', ' mm Hg')}</td><td>90/60 - 120/80 mm Hg</td></tr>
                        <tr><td>Lipids</td><td>${getValue(pathology?.lipids, 'Normal')}</td><td>Desirable</td></tr>
                        <tr><td>Total Cholesterol</td><td>${getValue(pathology?.total_cholesterol, 'N/A', ' mg/dL')}</td><td>&lt;200 mg/dL</td></tr>
                        <tr><td>Triglycerides</td><td>${getValue(pathology?.triglycerides, 'N/A', ' mg/dL')}</td><td>&lt;150 mg/dL</td></tr>
                        <tr><td>LDL</td><td>${getValue(pathology?.ldl, 'N/A', ' mg/dL')}</td><td>&lt;100 mg/dL</td></tr>
                        <tr><td>HDL</td><td>${getValue(pathology?.hdl, 'N/A', ' mg/dL')}</td><td>&gt;40 mg/dL(Men) &gt;50 mg/dL(Women)</td></tr>
                        <tr><td>VLDL</td><td>${getValue(pathology?.vldl, 'N/A', ' mg/dL')}</td><td>5 - 30 mg/dL</td></tr>
                    </table>
                </div>

                <!-- Respiratory Risk -->
                <div class="respiratory-section">
                    <div class="cardio-header">
                        <div class="logo-container"><img src="./7.png" alt="XRAi Logo"></div>
                        <div class="section-title">RESPIRATORY<br>RISK</div>
                    </div>
                    <table class="test-table">
                        <tr class="test-header-row">
                            <td>TEST</td>
                            <td>FINDINGS</td>
                            <td>RANGE</td>
                        </tr>
                        <tr><td>Body Temperature</td><td>${getValue(vitals?.body_temperature, 'N/A', '°F')}</td><td>97° - 99°F</td></tr>
                        <tr><td>Oxygen Saturation</td><td>${getValue(vitals?.oxygen_saturation, 'N/A', '%')}</td><td>&gt;95%</td></tr>
                    </table>
                </div>

                <!-- Kidney Function Test -->
                <div class="kidney-section">
                    <div class="cardio-header">
                        <div class="logo-container"><img src="./9.png" alt="XRAi Logo"></div>
                        <div class="section-title">KIDNEY<br>FUNCTION TEST</div>
                    </div>
                    <table class="test-table">
                        <tr class="test-header-row">
                            <td>TEST</td>
                            <td>FINDINGS</td>
                            <td>RANGE</td>
                        </tr>
                        <tr><td>Creatinine</td><td>${getValue(pathology?.creatinine, 'N/A', ' mg/dL')}</td><td>0.7 - 1.3 mg/dL</td></tr>
                        <tr><td>EGFR</td><td>${getValue(pathology?.egfr, 'N/A', ' mL/min/1.73m²')}</td><td>&gt;90 mL/min/1.73m²</td></tr>
                    </table>
                </div>
            </div>

            <!-- Center Column -->
            <div class="center-column">
                <div class="body-diagram">
                <div><img src="./humanbody.jpg" alt="XRAi Logo"></div>
                </div>
            </div>

            <!-- Right Column -->
            <div class="right-column">
                <!-- Blood Examination -->
                <div class="blood-section">
                    <div class="cardio-header">
                        <div class="logo-container"><img src="./6.png" alt="XRAi Logo"></div>
                        <div class="section-title">BLOOD EXAMINATION</div>
                    </div>
                    <table class="test-table">
                        <tr class="test-header-row">
                            <td>TEST</td>
                            <td>FINDINGS</td>
                            <td>RANGE</td>
                        </tr>
                        <tr><td>Hemoglobin</td><td>${getValue(pathology?.hb, 'N/A', ' g/dL')}</td><td>13.5 - 17.5 g/dL</td></tr>
                        <tr><td>RBC</td><td>${getValue(pathology?.rbc, 'N/A', ' M/μL')}</td><td>4.7 - 6.1 M/μL</td></tr>
                        <tr><td>M-cell</td><td>Normal</td><td>-----</td></tr>
                        <tr><td>PCV</td><td>${getValue(pathology?.pcv, 'N/A', '%')}</td><td>38.3 - 48.6%</td></tr>
                        <tr><td>MCV</td><td>${getValue(pathology?.mcv, 'N/A', ' fL')}</td><td>82 - 100 fL</td></tr>
                        <tr><td>MCH</td><td>${getValue(pathology?.mch, 'N/A', ' pg')}</td><td>27 - 33 pg</td></tr>
                        <tr><td>MCHC</td><td>${getValue(pathology?.mchc, 'N/A', ' g/dL')}</td><td>31 - 36 g/dL</td></tr>
                    </table>
                </div>

                <!-- Blood Glucose Assessment -->
                <div class="glucose-section">
                    <div class="cardio-header">
                        <div class="logo-container"><img src="./8.png" alt="XRAi Logo"></div>
                        <div class="section-title">BLOOD GLUCOSE<br>ASSESSMENT</div>
                    </div>
                    <table class="test-table">
                        <tr class="test-header-row">
                            <td>TEST</td>
                            <td>FINDINGS</td>
                            <td>RANGE</td>
                        </tr>
                        <tr><td>Blood Sugar Level</td><td>${getValue(pathology?.random_blood_sugar, 'N/A', ' mg/dL')}</td><td>70 - 99 mg/dL</td></tr>
                    </table>
                </div>

                <!-- Liver Function Test -->
                <div class="liver-section">
                    <div class="cardio-header">
                        <div class="logo-container"><img src="./10.png" alt="XRAi Logo"></div>
                        <div class="section-title">LIVER<br>FUNCTION TEST</div>
                    </div>
                    <table class="test-table">
                        <tr class="test-header-row">
                            <td>TEST</td>
                            <td>FINDINGS</td>
                            <td>RANGE</td>
                        </tr>
                        <tr><td>Direct Bilirubin</td><td>${getValue(pathology?.direct_bilirubin, 'N/A', ' mg/dL')}</td><td>0.0 - 0.3 mg/dL</td></tr>
                        <tr><td>Indirect Bilirubin</td><td>${getValue(pathology?.indirect_bilirubin, 'N/A', ' mg/dL')}</td><td>0.2 - 0.8 mg/dL</td></tr>
                        <tr><td>Total Bilirubin</td><td>${getValue(pathology?.total_bilirubin, 'N/A', ' mg/dL')}</td><td>0.1 - 1.2 mg/dL</td></tr>
                    </table>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
`;

container.appendChild(page3);


    // 3. Generate PDF Blob from 3 pages
    const pdfBlob = await html2pdf()
      .from(container)
      .set({
        margin: 0,
        filename: `Smart_Report_${p.unique_patient_id}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .outputPdf("blob");

    // 4. Upload generated report to backend
    const formData = new FormData();
    formData.append("patient_id", p.unique_patient_id);
    const file = new File([pdfBlob], `Smart_Report_${p.unique_patient_id}.pdf`, { type: "application/pdf" });
    formData.append("report_pdf", file);

    await axios.post("http://127.0.0.1:8000/api/technician/smart-report-upload/", formData);

    alert("Smart report PDF generated and uploaded successfully!");

  } catch (err) {
    console.error("Failed to generate/upload smart report:", err);
    alert("Error generating smart report.");
  }
};


const handleIdChange = (e) => {
  setIdFile(e.target.files[0]);
};


const handleLoanChange = (e) => {
  setLoanFile(e.target.files[0]);
};

  
  const handlePatientFormChange = (field, value) => {
    setPatientForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
const handleSubmitPatient = async (e) => {
  e.preventDefault();
  
  // Validate form fields
  const validation = onsiteAPI.validatePatientData(patientForm);
  if (!validation.isValid) {
    alert(`Please fill in: ${validation.errors.join(', ')}`);
    return;
  }
  

  // Validate selections
  if (!selectedCamp) {
    alert('Please select a camp first');
    return;
  }

  if (!selectedPackage) {
    alert('Please select a package first - try clicking the package again');
    return;
  }

  setIsSubmittingPatient(true);
  
  try {
    const patientData = onsiteAPI.formatPatientData(patientForm, selectedCamp, selectedPackage);
    await onsiteAPI.addPatient(patientData);
    // Reset form
    setPatientForm({ patient_id: '', name: '', age: '', gender: '', phone: '', services: '' });
    setShowAddPatientModal(false);
    
    // Refresh patient list
    fetchPackagePatients(selectedCamp.id, selectedPackage.id);
    
    alert('Patient added successfully!');
  } catch (error) {
    console.error(patientForm);
    console.error('Error adding patient:', error);
    alert(`Error: ${error.response?.data?.message || 'Failed to add patient'}`);
  } finally {
    setIsSubmittingPatient(false);
  }
};
  const handleCloseModal = () => {
    setShowAddPatientModal(false);
    setPatientForm({ name: '', age: '', gender: '', phone: '', services: '', load_number: '' });
  };

  // ADD PATIENT MODAL FUNCTION - ADDED HERE
  const renderAddPatientModal = () => {
    if (!showAddPatientModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '12px',
          padding: '32px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          {/* Modal Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px',
            borderBottom: `1px solid ${COLORS.mediumGrey}`,
            paddingBottom: '16px'
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: '600',
              color: COLORS.darkText 
            }}>
              Add New Patient
            </h2>
            <button
              onClick={handleCloseModal}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: COLORS.mediumText,
                padding: '4px',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
            >
              ×
            </button>
          </div>

          {/* Selected Package Info */}
          {selectedPackage && (
            <div style={{
              backgroundColor: COLORS.lightGrey,
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '24px',
              border: `1px solid ${COLORS.mediumGrey}`
            }}>
              <p style={{ margin: 0, fontSize: '14px', color: COLORS.mediumText }}>
                <strong>Adding patient to:</strong> {selectedPackage.name}
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: COLORS.lightText }}>
                Camp: {selectedCamp?.location}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmitPatient}>
            <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: COLORS.darkText,
              marginBottom: '8px'
            }}>
              Patient ID *
            </label>
            <input
              type="text"
              value={patientForm.patient_id}
              onChange={(e) => handlePatientFormChange('patient_id', e.target.value)}
              placeholder="Enter patient ID"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                border: `1px solid ${COLORS.mediumGrey}`,
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box'
              }}
            />
          </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: COLORS.darkText,
                marginBottom: '8px'
              }}>
                Patient Name *
              </label>
              <input
                type="text"
                value={patientForm.name}
                onChange={(e) => handlePatientFormChange('name', e.target.value)}
                placeholder="Enter patient's full name"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: COLORS.darkText,
                  marginBottom: '8px'
                }}>
                  Age *
                </label>
                <input
                  type="number"
                  value={patientForm.age}
                  onChange={(e) => handlePatientFormChange('age', e.target.value)}
                  placeholder="Enter age"
                  required
                  min="1"
                  max="120"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${COLORS.mediumGrey}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ flex: 1 }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: COLORS.darkText,
                  marginBottom: '8px'
                }}>
                  Gender *
                </label>
                <select
                  value={patientForm.gender}
                  onChange={(e) => handlePatientFormChange('gender', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `1px solid ${COLORS.mediumGrey}`,
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box',
                    backgroundColor: COLORS.white,
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: COLORS.darkText,
                marginBottom: '8px'
              }}>
                Phone Number *
              </label>
              <input
                type="tel"
                value={patientForm.phone}
                onChange={(e) => handlePatientFormChange('phone', e.target.value)}
                placeholder="Enter phone number (e.g., +91 9876543210)"
                required
                pattern="[+]?[0-9\s\-]{10,15}"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{
                fontSize: '12px',
                color: COLORS.lightText,
                marginTop: '4px',
                margin: '4px 0 0 0'
              }}>
                Include country code if applicable
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>      
  <label style={{      
    display: 'block',      
    fontSize: '14px',      
    fontWeight: '500',      
    color: COLORS.darkText,      
    marginBottom: '8px'      
  }}>      
    Load Number      
  </label>      
  <input      
    type="text"      
    value={patientForm.load_number}      
    onChange={(e) => handlePatientFormChange('load_number', e.target.value)}      
    placeholder="Enter load number"      
    style={{      
      width: '100%',      
      padding: '12px 16px',      
      border: `1px solid ${COLORS.mediumGrey}`,      
      borderRadius: '8px',      
      fontSize: '14px',      
      outline: 'none',      
      transition: 'all 0.2s',      
      boxSizing: 'border-box'      
    }}      
  />      
</div>                                                                                                    
          <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: COLORS.darkText,
                marginBottom: '8px'
              }}>
                Services *
              </label>
              <textarea
                value={patientForm.services}
                onChange={(e) => handlePatientFormChange('services', e.target.value)}
                placeholder="Enter services (comma-separated, e.g., Consultation, Blood Test, X-Ray)"
                required
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'all 0.2s',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
              <p style={{
                fontSize: '12px',
                color: COLORS.lightText,
                marginTop: '4px',
                margin: '4px 0 0 0'
              }}>
                Separate multiple services with commas
              </p>
            </div>

            {/* Form Actions */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'flex-end',
              borderTop: `1px solid ${COLORS.mediumGrey}`,
              paddingTop: '20px'
            }}>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmittingPatient}
                style={{
                  padding: '10px 20px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '8px',
                  backgroundColor: COLORS.white,
                  color: COLORS.mediumText,
                  cursor: isSubmittingPatient ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingPatient}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: isSubmittingPatient ? COLORS.mediumGrey : COLORS.success,
                  color: COLORS.white,
                  cursor: isSubmittingPatient ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isSubmittingPatient ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Adding...
                  </>
                ) : (
                  'Add Patient'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  


 const fetchData = useCallback(async () => {
    try {
      const camps = await onsiteAPI.getAllCamps();
      setData(camps);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching camps data:', error);
      setLoading(false);
    }
  }, []);



  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const fetchPackages = async (campId) => {
    setLoadingPackages(true);
    try {
      const campDetails = await onsiteAPI.getCampDetails(campId);
      setPackages(campDetails.packages || []);
    } catch (error) {
      console.error('Error fetching packages:', error);
      setPackages([]);
    } finally {
      setLoadingPackages(false);
    }
};



  const fetchPackagePatients = async (campId, packageId) => {
    setLoadingPatients(true);
    try {
      const patients = await onsiteAPI.getPackagePatients(campId, packageId);
      setPatients(patients);
      setOriginalPatients(patients);
    } catch (error) {
      console.error('Error fetching package patients:', error);
      setPatients([]);
      setOriginalPatients([]);
    } finally {
      setLoadingPatients(false);
    }
  };


  const handleAddDetailClick = (patient) => {
  setSelectedDetailPatient(patient);
  setShowDetailModal(true);
  setPhotoFile(null);
  setIdFile(null);
};



const handleCloseDetailModal = () => {
  setShowDetailModal(false);
  setPhotoFile(null);
  setIdFile(null);
};








  const handleCampClick = (camp) => {
    setSelectedCamp(camp);
    setSelectedPackage(null);
    setPatients([]);
    setOriginalPatients([]);
    setSearchTerm('');
    fetchPackages(camp.id);
  };


  const handlePackageClick = (packageItem) => {
    setSelectedPackage(packageItem);
    setSearchTerm('');
    fetchPackagePatients(selectedCamp.id, packageItem.id);
  };


  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    const filtered = onsiteUtils.filterPatients(originalPatients, term);
    setPatients(filtered);
  };





const handlePrintQR = async (patient) => {
  try {
    // Make API call to mark patient as checked-in & trigger thermal print
    const result = await onsiteAPI.printThermalSlips([patient.id]);
    
    // Open print window with patient QR
    const printWindow = window.open('', '_blank');
    const printContent = onsiteAPI.generatePrintContent(patient);
    printWindow.document.write(printContent);

  } catch (error) {
    console.error('Failed to print QR:', error);
    alert('Error printing QR. Check console.');
  }
};



  const handleCampStatus = (patientId) => {
    // Add camp status logic here
    console.log('Camp status for patient:', patientId);
  };


  const formatDate = onsiteUtils.formatDate;
  const getCampStatus = onsiteUtils.getCampStatus;


  // Add the missing render functions
  const renderCampProgressContent = () => {
    const readyCamps = data.filter(camp => camp.ready_to_go === true);


    return (
      <div>
        <h2 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: '600' }}>Camps Ready to Go</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {readyCamps.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <p>No camps are marked ready to go.</p>
            </div>
          )}
          {readyCamps.map(camp => (
            <div
              key={camp.id}
              onClick={() => handleCampClick(camp)}
              style={{
                padding: '16px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: selectedCamp?.id === camp.id ? '#eff6ff' : 'white',
                transition: 'all 0.2s',
                boxShadow: selectedCamp?.id === camp.id ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                {camp.location} (ID: {camp.id})
              </h3>
              <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                {camp.district}, {camp.state} | {formatDate(camp.start_date)} - {formatDate(camp.end_date)}
              </p>
            </div>
          ))}
        </div>


        {/* Packages section */}
        {selectedCamp && (
          <div style={{ marginTop: '32px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Packages for Camp: {selectedCamp.location} (ID: {selectedCamp.id})
            </h3>
            {loadingPackages ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={spinnerStyle}></div>
                <p style={{ marginTop: '12px', color: '#6b7280' }}>Loading packages...</p>
              </div>
            ) : packages.length === 0 ? (
              <p style={{ color: '#6b7280' }}>No packages found for this camp.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {packages.map(packageItem => (
                  <div key={packageItem.id} style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '16px',
                    backgroundColor: selectedPackage?.id === packageItem.id ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => handlePackageClick(packageItem)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                        {packageItem.name}
                        </h4>
                        <p style={{ margin: '4px 0 0 0', color: '#6b7280', fontSize: '14px' }}>
                        {formatDate(packageItem.start_date)} - {formatDate(packageItem.end_date)}
                        </p>
                    </div>
                    {/* ADD PATIENT Button */}
                   <button
  onClick={(e) => handleAddPatientClick(e, packageItem)}
  style={{
    backgroundColor: COLORS.success,
    color: COLORS.white,
    border: 'none',
    borderRadius: '6px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }}
>
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  ADD PATIENT
</button>
                    </div>


                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Enhanced Patients section with search functionality */}
        {selectedPackage && (
          <div style={{ marginTop: '32px', borderTop: `1px solid ${COLORS.mediumGrey}`, paddingTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0, color: COLORS.darkText }}>
                Patients for Package: {selectedPackage.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '8px', width: '300px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={handleSearch}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      border: `1px solid ${COLORS.mediumGrey}`,
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: COLORS.lightText
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPatients(originalPatients);
                    }}
                    style={{
                      padding: '8px 12px',
                      backgroundColor: COLORS.lightGrey,
                      color: COLORS.mediumText,
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>


            {loadingPatients ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={spinnerStyle}></div>
                <p style={{ marginTop: '12px', color: COLORS.mediumText }}>Loading patients...</p>
              </div>
            ) : patients.length === 0 ? (
              <div style={{ 
                backgroundColor: COLORS.lightGrey, 
                padding: '24px', 
                borderRadius: '8px', 
                textAlign: 'center',
                border: `1px dashed ${COLORS.mediumGrey}`
              }}>
                <p style={{ color: COLORS.mediumText, marginBottom: '8px' }}>
                  {searchTerm ? 'No matching patients found' : 'No patients found for this package'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setPatients(originalPatients);
                    }}
                    style={{
                      backgroundColor: COLORS.lightGrey,
                      color: COLORS.darkText,
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {patients.map(patient => (
                  <div key={patient.id} style={{
                    border: `1px solid ${COLORS.mediumGrey}`,
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: COLORS.white,
                    transition: 'all 0.2s'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                        <p style={{ margin: 0, fontWeight: '600', fontSize: '16px', color: COLORS.darkText }}>
                          {patient.name}
                        </p>
                        <span style={{
                          backgroundColor: COLORS.mediumGrey,
                          color: COLORS.darkGrey,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          ID: {patient.unique_patient_id}
                        </span>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14px', color: COLORS.mediumText }}>
                          Age: {patient.age}
                        </span>
                        <span style={{ fontSize: '14px', color: COLORS.mediumText }}>
                          Gender: {patient.gender}
                        </span>
                        <span style={{ fontSize: '14px', color: COLORS.mediumText }}>
                          Phone: {patient.phone}
                        </span>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '14px', color: COLORS.mediumText }}>
                          Services: {patient.services.join(', ')}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>


                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSmartReportGenerate(patient);
                          }}
                          style={{
                            backgroundColor: COLORS.orange,
                            color: COLORS.white,
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                          }}
                        >
                          SmartReportGenerator
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddDetailClick(patient); // set the patient context and show modal
                          }}
                          style={{
                            backgroundColor: COLORS.mediumGrey,
                            color: COLORS.darkText,
                            border: 'none',
                            borderRadius: '6px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                          }}
                        >
                          Add detail
                        </button>
                        
                        
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePrintQR(patient);
                        }}
                        style={{
                          backgroundColor: COLORS.aquaBlue,
                          color: COLORS.white,
                          border: 'none',
                          borderRadius: '6px',
                          padding: '8px 16px',
                          cursor: 'pointer',
                          fontWeight: '500',
                          fontSize: '14px',
                          transition: 'all 0.2s'
                        }}
                      >
                        Print QR
                      </button>
                      
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };


  const renderDetailModal = () => {
    console.log('Modal state:', { showDetailModal, selectedDetailPatient }); // Debug log

    if (!showDetailModal || !selectedDetailPatient) {
      return null;
    }

    return (

      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1100
      }}>
        <div style={{
          backgroundColor: COLORS.white,
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Upload Patient Details</h2>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
            <p style={{ margin: '0', color: COLORS.darkText }}>
              <strong>Patient ID:</strong> {selectedDetailPatient.unique_patient_id}
            </p>
            <p style={{ margin: '4px 0 0', color: COLORS.darkText }}>
              <strong>Name:</strong> {selectedDetailPatient.name}
            </p>
          </div>

          <form onSubmit={handleDetailSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ 
                display: 'block',
                fontWeight: '500', 
                color: COLORS.darkText,
                marginBottom: '8px'
              }}>
                Patient Photo *
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                required
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block',
                fontWeight: '500', 
                color: COLORS.darkText,
                marginBottom: '8px'
              }}>
                Aadhar ID Document *
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleIdChange}
                required
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '6px'
                }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block',
                fontWeight: '500', 
                color: COLORS.darkText,
                marginBottom: '8px'
              }}>
                Loan ID Document *
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleLoanChange}
                required
                style={{ 
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${COLORS.mediumGrey}`,
                  borderRadius: '6px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCloseDetailModal}
                style={{
                  ...buttonStyle,
                  backgroundColor: COLORS.lightGrey,
                  color: COLORS.darkText
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                style={{
                  ...buttonStyle,
                  backgroundColor: isUploading ? COLORS.mediumGrey : COLORS.success,
                  color: COLORS.white,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {isUploading ? (
                  <>
                    <div style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    Uploading...
                  </>
                ) : 'Upload Files'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };



  const [isUploading, setIsUploading] = useState(false);

const handleDetailSubmit = async (e) => {
  e.preventDefault();
  
  if (!photoFile || !idFile) {
    alert('Please select both photo and Aadhar ID files');
    return;
  }

  setIsUploading(true);
  
  try {
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('document_file', idFile);
    formData.append('unique_patient_id', selectedDetailPatient.unique_patient_id); // Changed from patient_id
    formData.append('loan_document_file', loanFile); // Added loan ID file

    console.log('Uploading details for patient:', selectedDetailPatient.unique_patient_id);
    
    await onsiteAPI.uploadPatientDetails(formData);
    
    alert('Files uploaded successfully!');
    handleCloseDetailModal();
    
    // Refresh patient list after successful upload
    if (selectedCamp && selectedPackage) {
      await fetchPackagePatients(selectedCamp.id, selectedPackage.id);
    }
  } catch (error) {
    console.error('Error uploading files:', error);
    alert(error.message || 'Error uploading files. Please try again.');
  } finally {
    setIsUploading(false);
  }
};
  


  const renderDashboardContent = () => {
    const filteredData = data.filter(camp => camp.ready_to_go === true);
    const groupedCamps = filteredData.reduce((acc, camp) => {
      if (!acc[camp.client]) acc[camp.client] = [];
      acc[camp.client].unshift(camp);
      return acc;
    }, {});


    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div style={summaryCardStyle}>
            <h3 style={summaryCardTitle}>Total Camps</h3>
            <p style={summaryCardValueBlue}>{filteredData.length}</p>
          </div>
          <div style={summaryCardStyle}>
            <h3 style={summaryCardTitle}>Active Clients</h3>
            <p style={summaryCardValueGreen}>{Object.keys(groupedCamps).length}</p>
          </div>
        </div>


        {/* Camp List */}
        {Object.entries(groupedCamps).map(([clientId, camps]) => (
          <div key={clientId} style={clientCardStyle}>
            <div style={clientHeaderStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={clientTitleStyle}>Client: {clientId}</h2>
                  <p style={clientSubTextStyle}>{camps.length} camp{camps.length > 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>


            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {camps.map((camp) => {
                  const status = getCampStatus(camp.start_date, camp.end_date);
                  return (
                    <div key={camp.id} style={campCardStyle}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                            <h3 style={campLocationStyle}>{camp.location}</h3>
                            <span style={{
                              ...statusBadgeStyle,
                              backgroundColor: status.status === 'Upcoming' ? '#dbeafe' :
                                status.status === 'Active' ? '#dcfce7' : '#f3f4f6',
                              color: status.status === 'Upcoming' ? '#1e40af' :
                                status.status === 'Active' ? '#166534' : '#374151'
                            }}>{status.status}</span>
                          </div>


                          <div style={campGridStyle}>
                            <div>
                              <p style={campSubText}>Location Details</p>
                              <p style={campInfo}>{camp.district}, {camp.state}</p>
                            </div>
                            <div>
                              <p style={campSubText}>Duration</p>
                              <p style={campInfo}>{formatDate(camp.start_date)} - {formatDate(camp.end_date)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };


  // Simplified menu items
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', color: 'text-blue-600' },
    { id: 'camp-progress', label: 'Camp Progress', color: 'text-indigo-600' },
    { id: 'logout', label: 'Log Out', color: 'text-red-600' }
  ];


  const handleMenuClick = (menuId) => {
    if (menuId === 'logout') {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      navigate('/login');
    } else {
      setActiveMenuItem(menuId);
      setSelectedCamp(null);
      setSelectedPackage(null);
      setPatients([]);
      setPackages([]);
      setSearchTerm('');
    }
  };


  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
    {/* Modal Renders */}
    {renderDetailModal()}
    {renderAddPatientModal()}
    
    {/* Sidebar */}
    <div style={{ width: '256px', backgroundColor: 'white', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', borderRight: '1px solid #e5e7eb' }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Onsite Coordinator</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>Limited Access Dashboard</p>
      </div>
      <nav style={{ marginTop: '24px' }}>
        {menuItems.map((item) => (
          <button 
            key={item.id} 
            onClick={() => handleMenuClick(item.id)}
            style={{
              width: '100%', 
              textAlign: 'left', 
              padding: '12px 24px',
              fontSize: '18px', 
              fontWeight: '500', 
              transition: 'all 0.2s',
              border: 'none', 
              cursor: 'pointer',
              backgroundColor: activeMenuItem === item.id ? '#eff6ff' : 'transparent',
              borderRight: activeMenuItem === item.id ? '4px solid #3b82f6' : 'none',
              color: {
                'text-blue-600': '#2563eb', 
                'text-indigo-600': '#4f46e5', 
                'text-red-600': '#dc2626'
              }[item.color]
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
    
    {/* Main Content */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ backgroundColor: 'white', padding: '16px 24px', borderBottom: '1px solid #e5e7eb' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
          {activeMenuItem === 'dashboard' ? 'Dashboard' : 'Camp Progress'}
        </h1>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {activeMenuItem === 'camp-progress' ? (
          loading ? (
            <div style={loaderContainerStyle}>
              <div style={{ textAlign: 'center' }}>
                <div style={spinnerStyle}></div>
                <p style={loadingTextStyle}>Loading camp data...</p>
              </div>
            </div>
          ) : (
            renderCampProgressContent()
          )
        ) : loading ? (
          <div style={loaderContainerStyle}>
            <div style={{ textAlign: 'center' }}>
              <div style={spinnerStyle}></div>
              <p style={loadingTextStyle}>Loading camp data...</p>
            </div>
          </div>
        ) : Array.isArray(data) && data.length > 0 ? (
          renderDashboardContent()
        ) : (
          <div style={loaderContainerStyle}>
            <div style={{ textAlign: 'center' }}>
              <div style={emptyStateIcon}></div>
              <p style={loadingTextStyle}>No camp data available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
  );
};


// Style constants
const loaderContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' };
const spinnerStyle = { border: '4px solid #e5e7eb', borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '36px', height: '36px', animation: 'spin 1s linear infinite', margin: 'auto' };
const loadingTextStyle = { fontSize: '16px', color: '#6b7280', marginTop: '12px' };
const emptyStateIcon = { width: '40px', height: '40px', backgroundColor: '#e5e7eb', borderRadius: '50%', margin: 'auto' };
const summaryCardStyle = {
  backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e5e7eb',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
};
const summaryCardTitle = { fontSize: '14px', fontWeight: '500', color: '#6b7280', margin: 0 };
const summaryCardValueBlue = { fontSize: '24px', fontWeight: 'bold', color: '#2563eb', marginTop: '8px' };
const summaryCardValueGreen = { ...summaryCardValueBlue, color: '#16a34a' };
const clientCardStyle = { backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', overflow: 'hidden' };
const clientHeaderStyle = { background: 'linear-gradient(to right, #3b82f6, #2563eb)', padding: '16px 24px' };
const clientTitleStyle = { fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 };
const clientSubTextStyle = { color: '#bfdbfe', marginTop: '4px', margin: '4px 0 0 0' };
const campCardStyle = {
  border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', transition: 'box-shadow 0.2s'
};
const campLocationStyle = { fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 };
const statusBadgeStyle = { padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' };
const campGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' };
const campSubText = { fontSize: '14px', color: '#6b7280', marginBottom: '4px' };
const campInfo = { fontWeight: '500', marginBottom: '4px' };
const buttonStyle = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: '8px',
  fontWeight: '500',
  fontSize: '14px',
  cursor: 'pointer',
  transition: 'all 0.2s',
};


export default OnsiteDashboard;
