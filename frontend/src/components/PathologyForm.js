import React, { useState, useEffect } from 'react';
import html2pdf from 'html2pdf.js';
import {api , BASE_URL} from './api';
import { useLocation, useNavigate } from 'react-router-dom';

const PathologyFormurl = '/technician/pathology';

function PathologyForm() {
  const location = useLocation();
  const { patientId, patientName, technicianId, serviceId } = location.state || {};
  const navigate = useNavigate();

  // Rename the state variable to formData and the setter to setFormData
  const [formData, setFormData] = useState({
    name: patientName || '',
    id: patientId || '',
    rbc: '',
    hb: '',
    randomBloodSugar: '',
    creatinine: '',
    egfr: '',
    totalBilirubin: '',
    directBilirubin: '',
    indirectBilirubin: '',
    totalCholesterol: '',
    triglycerides: '',
    ldl: '',
    hdl: '',
    vldl: '',
    pcv: '',
    mcv: '',
    mch: '',
    mchc: '',
    lipids: ''
});



  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Auto-fill patient information when component mounts
    if (patientName && patientId) {
      setFormData(prev => ({
        ...prev,
        name: patientName,
        id: patientId
      }));
    }
  }, [patientName, patientId]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

const getReportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Health Check-up Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            background: white;
            padding: 20px;
          }
          
          .report-container {
            max-width: 210mm;
            margin: 0 auto;
            border: 4px solid #000;
            background: white;
            position: relative;
          }
          
          .header {
            text-align: center;
            padding: 20px;
            background: #f8f8f8;
            border-bottom: 3px solid #000;
          }
          
          .header h1 {
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 0;
          }
          
          .content-wrapper {
            display: flex;
            min-height: 800px;
            position: relative;
          }
          
          .left-column {
            width: 35%;
            padding: 20px;
          }
          
          .center-column {
            width: 30%;
            padding: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            position: relative;
          }
          
          .right-column {
            width: 35%;
            padding: 20px;
          }
          
          .test-section {
            margin-bottom: 25px;
            margin-top: 100px;
          }
          
          .test-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
          }
          
          .organ-icon {
            width: 50px;
            height: 50px;
            margin-right: 15px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
          }
          
          .liver-icon { background: #8B4513; }
          .lung-icon { background: #FF6B6B; }
          .kidney-icon { background: #4ECDC4; }
          .heart-icon { background: #FF69B4; }
          
          .test-title {
            font-weight: bold;
            font-size: 14px;
            line-height: 1.2;
          }
          
          .test-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          
          .test-table td {
            padding: 4px 6px;
            border: 1px solid #333;
          }
          
          .test-table td:first-child {
            background: #f0f0f0;
            font-weight: bold;
            width: 40%;
          }
          
          .test-table td:nth-child(2) {
            text-align: center;
            width: 25%;
          }
          
          .test-table td:last-child {
            font-size: 9px;
            color: #666;
            width: 35%;
          }
          
          .body-diagram {
            width: 180px;
            height: 320px;
            position: relative;
            margin: 20px 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
          }
          
          .body-image {
            width: 100%;
            height: 280px;
            object-fit: contain;
            border-radius: 10px;
          }
          
          .body-info {
            position: absolute;
            bottom: 10px;
            text-align: center;
            font-size: 12px;
            color: #333;
            background: rgba(255,255,255,0.9);
            padding: 5px;
            border-radius: 5px;
          }
          
          .anemia-section {
            background: #f9f9f9;
            padding: 15px;
            margin-bottom: 20px;
          }
          
          .diabetes-section {
            background: #E3F2FD;
            margin-bottom: 100px;
            margin-top: 100px;
          }
          
          .cardiovascular-section {
            background: #FFEBEE;
            padding: 15px;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin-bottom: 10px;
          }
          
          .cardio-header {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 10px;
          }
          
          .cardio-header .heart-icon {
            margin-right: 10px;
          }
          
          @media print {
            body { padding: 0; }
            .report-container { 
              border: 2px solid #000;
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1>HEALTH CHECK-UP REPORT</h1>
            <p style="margin-top: 10px; font-size: 16px;"><strong>Patient:</strong> ${formData.name} | <strong>ID:</strong> ${formData.id}</p>
          </div>
          
          <div class="content-wrapper">
            <!-- Left Column -->
            <div class="left-column">
              <!-- Liver Function Test -->
              <div class="test-section">
                <div class="test-header">
                  <div class="organ-icon liver-icon">🫀</div>
                  <div class="test-title">LIVER FUNCTION<br>TEST</div>
                </div>
                <table class="test-table">
                  <tr>
                    <td>Total Bilirubin</td>
                    <td>${formData.totalBilirubin || '0'}</td>
                    <td>0.1 - 1.0 mg/dL</td>
                  </tr>
                </table>
              </div>
              
              <!-- Respiratory Risk -->
              <div class="test-section">
                <div class="test-header">
                  <div class="organ-icon lung-icon">🫁</div>
                  <div class="test-title">RESPIRATORY<br>RISK</div>
                </div>
                <table class="test-table">
                  <tr>
                    <td>Body temperature</td>
                    <td>${formData.bodyTemperature || '98.4'} F</td>
                    <td>98 F</td>
                  </tr>
                  <tr>
                    <td>Oxygen saturation</td>
                    <td>${formData.oxygenSaturation || '95'}%</td>
                    <td>95-100 %</td>
                  </tr>
                </table>
              </div>
              
              <!-- Kidney Function Test -->
              <div class="test-section">
                <div class="test-header">
                  <div class="organ-icon kidney-icon">🫘</div>
                  <div class="test-title">KIDNEY<br>FUNCTION<br>TEST</div>
                </div>
                <table class="test-table">
                  <tr>
                    <td>Creatinine</td>
                    <td>${formData.creatinine || '0.86'}<br>mg/dL</td>
                    <td>0.6-1.3 mg/dL</td>
                  </tr>
                  <tr>
                    <td>Egfr</td>
                    <td>${formData.egfr || '0'}</td>
                    <td>>90 mL/min/1.73 m²</td>
                  </tr>
                </table>
              </div>
            </div>
            
            <!-- Center Column -->
            <div class="center-column">
              <div class="body-diagram">
                <div style="width: 100%; height: 280px; background: #f0f0f0; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #666;">
                   <img src="./humanbody.png" alt="Human Body Diagram" class="body-image">
                </div>
              </div>
            </div>
            
            <!-- Right Column -->
            <div class="right-column">
              <!-- Anemia Section -->
              <div class="anemia-section">
                <div class="section-title">ANEMIA</div>
                <table class="test-table">
                  <tr>
                    <td>Haemoglobin</td>
                    <td>${formData.hb || '0'}</td>
                    <td>12.1-15.1 g/dL</td>
                  </tr>
                  <tr>
                    <td>RBC</td>
                    <td>${formData.rbc || '0'}</td>
                    <td>4.5</td>
                  </tr>
                </table>
              </div>
              
              <!-- Diabetes Section -->
              <div class="diabetes-section">
                <div class="section-title">DIABETES</div>
                <table class="test-table">
                  <tr>
                    <td>Blood sugar level</td>
                    <td>${formData.randomBloodSugar || '0'} mg/dL</td>
                    <td>70-100 mg/dL</td>
                  </tr>
                </table>
              </div>
              
              <!-- Cardiovascular Risk -->
              <!--<div class="cardiovascular-section">
                <div class="cardio-header">
                  <div class="organ-icon heart-icon">🫀</div>
                  <div class="section-title">CARDIOVASCULAR<br>RISK</div>
                </div>
                <table class="test-table">
                  <tr>
                    <td>Heart Rate</td>
                    <td>${formData.heartRate || formData.pulse || '75'} beats/ minute</td>
                    <td>62-80 beats/ minute</td>
                  </tr>
                  <tr>
                    <td>Blood Pressure</td>
                    <td>${formData.bp || '139/77'} mm hg</td>
                    <td>80/120 mm hg</td>
                  </tr>
                  <tr>
                    <td><strong>Lipids</strong></td>
                    <td></td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>Total Cholesterol</td>
                    <td>${formData.lipid || '0'}</td>
                    <td><200 mg/dL</td>
                  </tr>
                  <tr>
                    <td>Triglycerides</td>
                    <td>0</td>
                    <td><150 mg/dL</td>
                  </tr>
                  <tr>
                    <td>LDL</td>
                    <td>0</td>
                    <td><100 mg/dL</td>
                  </tr>
                  <tr>
                    <td>HDL</td>
                    <td>0</td>
                    <td>>40 mg/dL (men),<br>>50 mg/dL (women)</td>
                  </tr>
                  <tr>
                    <td>VLDL</td>
                    <td>0</td>
                    <td>Normal: 2-30 mg/dL</td>
                  </tr>
                </table>
              </div>
              -->
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };



  const generatePDFBlob = async () => {
    try {
      const htmlContent = getReportHTML();
      const element = document.createElement('div');
      element.innerHTML = htmlContent;
      document.body.appendChild(element);

      const pdfBlob = await html2pdf()
        .set({
          margin: 1,
          filename: 'health_report.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(element)
        .outputPdf('blob');
      console.log('PDF Blob generated successfully');
      document.body.removeChild(element);
      return pdfBlob;
    } catch (error) {
      console.error('Error generating PDF blob:', error);
      throw error;
    }
  };

  const saveToAPI = async (pdfBlob) => {
    try {
      const formDataAPI = new FormData();
  
      // Required API fields
      formDataAPI.append('patient_unique_id', formData.id);
      formDataAPI.append('rbc', formData.rbc || '');
      formDataAPI.append('hb', formData.hb || '');
      formDataAPI.append('random_blood_sugar', formData.randomBloodSugar || '');
      formDataAPI.append('creatinine', formData.creatinine || '');
      formDataAPI.append('egfr', formData.egfr || '');
      formDataAPI.append('total_bilirubin', formData.totalBilirubin || '');
      formDataAPI.append('direct_bilirubin', formData.directBilirubin || '');
      formDataAPI.append('indirect_bilirubin', formData.indirectBilirubin || '');
      formDataAPI.append('total_cholesterol', formData.totalCholesterol || '');
      formDataAPI.append('triglycerides', formData.triglycerides || '');
      formDataAPI.append('ldl', formData.ldl || '');
      formDataAPI.append('hdl', formData.hdl || '');
      formDataAPI.append('vldl', formData.vldl || '');
      formDataAPI.append('pcv', formData.pcv || '');
      formDataAPI.append('mcv', formData.mcv || '');
      formDataAPI.append('mch', formData.mch || '');
      formDataAPI.append('mchc', formData.mchc || '');
      formDataAPI.append('lipids', formData.lipids || '');
      // PDF Report File
      const pdfFile = new File([pdfBlob], 'health_report.pdf', { type: 'application/pdf' });
      formDataAPI.append('report', pdfFile);
  
      const response = await fetch(`${BASE_URL}/api/technician/pathology/`, {
        method: 'POST',
        body: formDataAPI,
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save pathology data');
      }
  
      console.log('Data saved successfully:', response);
      return await response.json();
    } catch (error) {
      console.error('Error saving to API:', error);
      throw error;
    }
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate PDF as blob
      const pdfBlob = await generatePDFBlob();
      
      // Save data to API with PDF
      await saveToAPI(pdfBlob);
      
      // Open PDF in new window for printing
      // const printWindow = window.open('', '_blank');
      // printWindow.document.write(getReportHTML());
      // printWindow.document.close();
      
      setTimeout(() => {
        // printWindow.print();
        alert('Data and PDF saved successfully!');
        
      }, 500);
      navigate(-1);
    } catch (error) {
      console.error('Error in form submission:', error);
      alert('Failed to save pathology data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '30px', color: '#333' }}>Pathology Form</h2>
        
        {/* Display patient info if available */}
        {patientName && patientId && (
          <div style={{ backgroundColor: '#e8f5e8', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <h4 style={{ color: '#2d5a2d', marginBottom: '5px' }}>Patient Information</h4>
            <p><strong>Name:</strong> {patientName}</p>
            <p><strong>ID:</strong> {patientId}</p>
            {technicianId && <p><strong>Technician ID:</strong> {technicianId}</p>}
            {serviceId && <p><strong>Service ID:</strong> {serviceId}</p>}
          </div>
        )}
        
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>

  {/* Patient Information */}
  <div style={{ gridColumn: '1 / -1' }}>
    <h3 style={{ color: '#555', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>Patient Details</h3>
  </div>

  <div>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Patient Name</label>
    <input
      type="text"
      name="name"
      value={formData.name}
      onChange={handleChange}
      readOnly
      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#f9f9f9' }}
    />
  </div>

  <div>
    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>Patient ID</label>
    <input
      type="text"
      name="id"
      value={formData.id}
      onChange={handleChange}
      readOnly
      style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', backgroundColor: '#f9f9f9' }}
    />
  </div>

  {/* Lab Test Fields */}
  <div style={{ gridColumn: '1 / -1' }}>
    <h3 style={{ color: '#555', borderBottom: '2px solid #28a745', paddingBottom: '5px' }}>Lab Test Results</h3>
  </div>

  {[
  { name: 'rbc', label: 'RBC Count' },
  { name: 'hb', label: 'Hemoglobin (Hb)' },
  { name: 'randomBloodSugar', label: 'Random Blood Sugar (mg/dL)' },
  { name: 'creatinine', label: 'Creatinine (mg/dL)' },
  { name: 'egfr', label: 'eGFR (mL/min)' },
  { name: 'totalBilirubin', label: 'Total Bilirubin (mg/dL)' },
  { name: 'directBilirubin', label: 'Direct Bilirubin (mg/dL)' },
  { name: 'indirectBilirubin', label: 'Indirect Bilirubin (mg/dL)' },
  { name: 'totalCholesterol', label: 'Total Cholesterol (mg/dL)' },
  { name: 'triglycerides', label: 'Triglycerides (mg/dL)' },
  { name: 'ldl', label: 'LDL (mg/dL)' },
  { name: 'hdl', label: 'HDL (mg/dL)' },
  { name: 'vldl', label: 'VLDL (mg/dL)' },
  { name: 'pcv', label: 'PCV (%)' },
  { name: 'mcv', label: 'MCV (fL)' },
  { name: 'mch', label: 'MCH (pg)' },
  { name: 'mchc', label: 'MCHC (g/dL)' },
  { name: 'lipids', label: 'Lipids (summary/remarks)' }
].map((field) => (
    <div key={field.name}>
      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>{field.label}</label>
      <input
        type="text"
        name={field.name}
        value={formData[field.name]}
        onChange={handleChange}
        style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px' }}
      />
    </div>
  ))}
</div>
<div style={{ gridColumn: '1 / -1', textAlign: 'center', marginTop: '30px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
                  color: 'white',
                  padding: '12px 30px',
                  border: 'none',
                  borderRadius: '5px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) e.target.style.backgroundColor = '#0056b3';
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) e.target.style.backgroundColor = '#007bff';
                }}
              >
                {isSubmitting ? 'Processing...' : 'Generate & Download PDF Report'}
              </button>
            </div>

        </div>
      </div>
    </form>
  );
}

export default PathologyForm;