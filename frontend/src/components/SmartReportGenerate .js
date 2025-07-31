import html2pdf from "html2pdf.js";
import axios from "axios";

const handleSmartReportGenerate = async (patient) => {
  try {
    // 1. Get full smart report data
    const { data } = await axios.get(`http://127.0.0.1:8000/api/technician/smart-report/${patient.unique_patient_id}/`);
    const { patient: p, vitals, pathology, bmr_pdf_base64 } = data;

    // 2. Create temporary div for 3-page PDF
    const container = document.createElement("div");

    // ----------- PAGE 1: PATIENT DETAILS -----------
    const page1 = document.createElement("div");
    page1.style.pageBreakAfter = "always";
    page1.innerHTML = `
      <div style="padding: 40px; font-family: Arial;">
        <h1>Patient Details</h1>
        <p><strong>ID:</strong> ${p.unique_patient_id}</p>
        <p><strong>Name:</strong> ${p.name}</p>
        <p><strong>Age:</strong> ${p.age}</p>
        <p><strong>Gender:</strong> ${p.gender}</p>
      </div>
    `;
    container.appendChild(page1);

    // ----------- PAGE 2: VITALS SUMMARY -----------
    const vitalsFields = Object.entries(vitals || {})
      .map(([key, val]) => `<li><strong>${key.replaceAll("_", " ")}:</strong> ${val ?? "N/A"}</li>`)
      .join("");

    const page2 = document.createElement("div");
    page2.style.pageBreakAfter = "always";
    page2.innerHTML = `
      <div style="padding: 40px; font-family: Arial;">
        <h1>Vitals Summary</h1>
        <ul>${vitalsFields}</ul>
      </div>
    `;
    container.appendChild(page2);

    // ----------- PAGE 3: PATHOLOGY + BMR PDF (if present) -----------
    const pathologyFields = Object.entries(pathology || {})
      .map(([key, val]) => `<li><strong>${key.replaceAll("_", " ")}:</strong> ${val ?? "N/A"}</li>`)
      .join("");

    const page3 = document.createElement("div");
    page3.innerHTML = `
      <div style="padding: 40px; font-family: Arial;">
        <h1>Pathology Report</h1>
        <ul>${pathologyFields}</ul>
        ${bmr_pdf_base64 ? "<p><em>Note: Additional BMR PDF attached separately.</em></p>" : ""}
      </div>
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
    formData.append("report_pdf", pdfBlob, `Smart_Report_${p.unique_patient_id}.pdf`);

    await axios.post("http://127.0.0.1:8000/api/technician/smart-report/upload/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    alert("Smart report PDF generated and uploaded successfully!");

  } catch (err) {
    console.error("Failed to generate/upload smart report:", err);
    alert("Error generating smart report.");
  }
};
