export const generateSubmissionPDFReport = (submission: any) => {
  const reportData = {
    header: {
      title: "AI Validation Report - LoanSetu",
      submissionId: submission._id,
      generatedAt: new Date().toISOString(),
      loanNumber: submission.loanId?.loanNumber || "N/A",
    },
    
    executiveSummary: {
      decision: submission.aiSummary?.decision || "PENDING",
      riskScore: submission.aiSummary?.riskScore || 0,
      flagsCount: submission.aiSummary?.flags?.length || 0,
      applicantName: submission.loanId?.applicantName || submission.beneficiaryId?.name || "N/A",
    },
    
    loanDetails: {
      loanNumber: submission.loanId?.loanNumber || "N/A",
      applicantName: submission.loanId?.applicantName || "N/A",
      sanctionedAmount: submission.loanId?.sanctionedAmount || 0,
      sanctionDate: submission.loanId?.sanctionDate || null,
      submissionType: submission.submissionType,
      status: submission.status,
    },
    
    aiAnalysis: {
      riskScore: submission.aiSummary?.riskScore || 0,
      decision: submission.aiSummary?.decision || "PENDING",
      flags: submission.aiSummary?.flags || [],
      features: submission.aiSummary?.features || {},
    },
    
    llmReport: (() => {
      try {
        return JSON.parse(submission.llmReport || "{}");
      } catch {
        return {};
      }
    })(),
    
    mediaAnalysis: {
      totalMedia: submission.media?.length || 0,
      images: submission.media?.filter((m: any) => m.type === "IMAGE").length || 0,
      videos: submission.media?.filter((m: any) => m.type === "VIDEO").length || 0,
      documents: submission.media?.filter((m: any) => m.type === "DOCUMENT").length || 0,
      exifPresent: submission.aiSummary?.features?.exif_any_present || false,
      gpsPresent: submission.aiSummary?.features?.exif_any_gps_present || false,
    },
    
    deviceInfo: submission.deviceInfo || {},
    captureContext: submission.captureContext || {},
    
    technicalMetrics: {
      blurScore: submission.aiSummary?.features?.avg_blur_variance || null,
      elaScore: submission.aiSummary?.features?.ela_avg_score || null,
      daysAfterSanction: submission.aiSummary?.features?.days_after_sanction || null,
      screenshotCount: submission.aiSummary?.features?.screenshot_count || 0,
      printedSuspectCount: submission.aiSummary?.features?.printed_suspect_count || 0,
      duplicateMatches: submission.aiSummary?.features?.duplicate_matches?.length || 0,
    },
    
    invoiceAnalysis: {
      present: submission.aiSummary?.features?.invoice_present || false,
      amount: submission.aiSummary?.features?.invoice_amount_ocr || null,
      date: submission.aiSummary?.features?.invoice_date_ocr || null,
      ocrText: submission.aiSummary?.features?.invoice_ocr_text || null,
    },
    
    locationData: {
      assetLocation: submission.aiSummary?.features?.asset_location || null,
      homeLocation: submission.aiSummary?.features?.home_location || null,
      distanceKm: submission.aiSummary?.features?.gps_home_vs_asset_km || null,
    },
    
    timestamps: {
      created: submission.createdAt,
      updated: submission.updatedAt,
      earliestCapture: submission.aiSummary?.features?.earliest_capture_date || null,
      latestCapture: submission.aiSummary?.features?.latest_capture_date || null,
    },
  };
  
  return reportData;
};


export const formatReportForDisplay = (reportData: any) => {
  return {
    sections: [
      {
        title: "Executive Summary",
        content: [
          { label: "Decision", value: reportData.executiveSummary.decision },
          { label: "Risk Score", value: reportData.executiveSummary.riskScore },
          { label: "Flags Detected", value: reportData.executiveSummary.flagsCount },
          { label: "Applicant", value: reportData.executiveSummary.applicantName },
        ],
      },
      {
        title: "Loan Information",
        content: [
          { label: "Loan Number", value: reportData.loanDetails.loanNumber },
          { label: "Sanctioned Amount", value: `₹${reportData.loanDetails.sanctionedAmount.toLocaleString()}` },
          { label: "Sanction Date", value: reportData.loanDetails.sanctionDate ? new Date(reportData.loanDetails.sanctionDate).toLocaleDateString() : "N/A" },
          { label: "Submission Type", value: reportData.loanDetails.submissionType },
        ],
      },
      {
        title: "AI Analysis",
        content: [
          { label: "Risk Score", value: reportData.aiAnalysis.riskScore },
          { label: "Decision", value: reportData.aiAnalysis.decision },
          { label: "Flags", value: reportData.aiAnalysis.flags.join(", ") || "None" },
        ],
      },
      {
        title: "Media Analysis",
        content: [
          { label: "Total Media Files", value: reportData.mediaAnalysis.totalMedia },
          { label: "Images", value: reportData.mediaAnalysis.images },
          { label: "Videos", value: reportData.mediaAnalysis.videos },
          { label: "Documents", value: reportData.mediaAnalysis.documents },
          { label: "EXIF Present", value: reportData.mediaAnalysis.exifPresent ? "Yes" : "No" },
          { label: "GPS Present", value: reportData.mediaAnalysis.gpsPresent ? "Yes" : "No" },
        ],
      },
      {
        title: "Technical Metrics",
        content: [
          { label: "Blur Score", value: reportData.technicalMetrics.blurScore?.toFixed(2) || "N/A" },
          { label: "ELA Score", value: reportData.technicalMetrics.elaScore?.toFixed(2) || "N/A" },
          { label: "Days After Sanction", value: reportData.technicalMetrics.daysAfterSanction || "N/A" },
          { label: "Screenshots", value: reportData.technicalMetrics.screenshotCount },
          { label: "Printed Suspects", value: reportData.technicalMetrics.printedSuspectCount },
          { label: "Duplicate Matches", value: reportData.technicalMetrics.duplicateMatches },
        ],
      },
    ],
  };
};


export const generateHTMLReport = (submission: any) => {
  const reportData = generateSubmissionPDFReport(submission);
  const formatted = formatReportForDisplay(reportData);
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AI Validation Report - ${reportData.header.submissionId}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          color: #2563eb;
          margin-bottom: 10px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #1e40af;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 10px;
        }
        .content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }
        .content-item {
          padding: 10px;
          background: #f9fafb;
          border-radius: 5px;
        }
        .label {
          font-weight: bold;
          color: #6b7280;
          font-size: 0.9em;
        }
        .value {
          margin-top: 5px;
          color: #111827;
        }
        .decision-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 1.2em;
        }
        .approved { background: #10b981; color: white; }
        .rejected { background: #ef4444; color: white; }
        .review { background: #f59e0b; color: white; }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #6b7280;
          font-size: 0.9em;
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
        }
        @media print {
          body { padding: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>AI Validation Report</h1>
        <p><strong>Submission ID:</strong> ${reportData.header.submissionId}</p>
        <p><strong>Loan Number:</strong> ${reportData.header.loanNumber}</p>
        <p><strong>Generated:</strong> ${new Date(reportData.header.generatedAt).toLocaleString()}</p>
        <p>
          <span class="decision-badge ${
            reportData.executiveSummary.decision === "APPROVED" ? "approved" :
            reportData.executiveSummary.decision === "REJECTED" ? "rejected" : "review"
          }">
            ${reportData.executiveSummary.decision.replace(/_/g, " ")}
          </span>
        </p>
      </div>
      
      ${formatted.sections.map((section: any) => `
        <div class="section">
          <h2>${section.title}</h2>
          <div class="content-grid">
            ${section.content.map((item: any) => `
              <div class="content-item">
                <div class="label">${item.label}</div>
                <div class="value">${item.value}</div>
              </div>
            `).join("")}
          </div>
        </div>
      `).join("")}
      
      ${reportData.llmReport?.summary ? `
        <div class="section">
          <h2>AI Summary</h2>
          <p>${reportData.llmReport.summary}</p>
        </div>
      ` : ""}
      
      ${reportData.llmReport?.reasons?.length > 0 ? `
        <div class="section">
          <h2>Key Findings</h2>
          <ul>
            ${reportData.llmReport.reasons.map((reason: string) => `<li>${reason}</li>`).join("")}
          </ul>
        </div>
      ` : ""}
      
      ${reportData.llmReport?.recommendationForBankAdmin ? `
        <div class="section">
          <h2>Recommendation</h2>
          <p>${reportData.llmReport.recommendationForBankAdmin}</p>
        </div>
      ` : ""}
      
      <div class="footer">
        <p><strong>LoanSetu - AI-Powered Loan Management System</strong></p>
        <p>This report is generated by LoanSetu AI Engine v1.0</p>
        <p>Confidential - For Official Use Only</p>
      </div>
    </body>
    </html>
  `;
  
  return html;
};


export const printReport = (submission: any) => {
  const html = generateHTMLReport(submission);
  const printWindow = window.open("", "_blank");
  
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
};

export const downloadHTMLReport = (submission: any) => {
  const html = generateHTMLReport(submission);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ai-validation-report-${submission._id}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
