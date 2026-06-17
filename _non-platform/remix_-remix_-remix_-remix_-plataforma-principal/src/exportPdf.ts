import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { PRACTICE_UNITS } from "./data";
import { PracticeUnit } from "./types";

export const exportSyllabusPDF = (completedUnits: number[]) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Curriculum Syllabus Overview", 14, 20);
  
  // Subtitle
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text("MET English Proficiency Mastery - Status Report", 14, 28);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 34);
  
  doc.setTextColor(0);

  // Table Data
  const tableData = PRACTICE_UNITS.map((unit: PracticeUnit) => {
    const isCompleted = completedUnits.includes(unit.id);
    const status = isCompleted ? "Completed" : "Pending";
    
    // Objectives could combine theme and tasks
    const objectives = [
      `Reading: ${unit.reading.title}`,
      `Listening: ${unit.listening.title}`,
      `Speaking: ${unit.speaking.title}`,
      `Writing: ${unit.writing.title}`
    ].join('\\n');

    return [
      `Unit ${unit.id}`,
      unit.theme,
      objectives,
      status
    ];
  });

  (doc as any).autoTable({
    startY: 40,
    head: [['Unit', 'Theme', 'Core Objectives', 'Status']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 4,
      valign: 'top',
    },
    headStyles: {
      fillColor: [45, 139, 139],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 35 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 20, fontStyle: 'bold' }
    },
    didDrawCell: (data: any) => {
      // Custom styling for status column
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === 'Completed') {
          doc.setTextColor(46, 204, 113); // Green
        } else {
          doc.setTextColor(231, 76, 60); // Red
        }
      }
    }
  });

  doc.save("Syllabus_Report.pdf");
};
