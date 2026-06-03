
import jsPDF from 'jspdf';
import { Script } from '@/types/database';

export const exportScriptToPDF = (script: Script) => {
  // Créer une nouvelle instance PDF
  const pdf = new jsPDF();
  
  // Configuration des marges et de la mise en page
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  
  let currentY = margin;
  
  // Fonction helper pour ajouter du texte avec gestion des sauts de page
  const addTextToPDF = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    // Vérifier si on a besoin d'une nouvelle page
    if (currentY + (lines.length * fontSize * 0.35) > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }
    
    lines.forEach((line: string) => {
      pdf.text(line, margin, currentY);
      currentY += fontSize * 0.35;
    });
    
    currentY += 5; // Espacement après le texte
  };
  
  // En-tête du document
  addTextToPDF(script.title, 16, true);
  addTextToPDF(`Genre: ${script.genre} | Âge: ${script.age_range} | Thème: ${script.theme}`, 10);
  
  if (script.custom_idea) {
    addTextToPDF(`Idée personnalisée: ${script.custom_idea}`, 10);
  }
  
  addTextToPDF(`Date de création: ${new Date(script.created_at).toLocaleDateString('fr-FR')}`, 10);
  addTextToPDF(`Nombre de mots: ${script.word_count || 'Non calculé'}`, 10);
  
  // Ligne de séparation
  currentY += 10;
  pdf.setDrawColor(0, 0, 0);
  pdf.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 15;
  
  // Contenu du scénario
  addTextToPDF('CONTENU DU SCÉNARIO', 12, true);
  addTextToPDF(script.content, 10);
  
  // Pied de page sur chaque page
  const totalPages = pdf.internal.pages.length - 1; // -1 car le premier élément est null
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Généré par ScriptAI - Page ${i} sur ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  // Télécharger le PDF
  const filename = `${script.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
  pdf.save(filename);
};

export const exportMultipleScriptsToPDF = (scripts: Script[]) => {
  if (scripts.length === 0) return;
  
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  
  let currentY = margin;
  let isFirstScript = true;
  
  const addTextToPDF = (text: string, fontSize: number = 10, isBold: boolean = false) => {
    pdf.setFontSize(fontSize);
    if (isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    
    const lines = pdf.splitTextToSize(text, maxWidth);
    
    if (currentY + (lines.length * fontSize * 0.35) > pageHeight - margin) {
      pdf.addPage();
      currentY = margin;
    }
    
    lines.forEach((line: string) => {
      pdf.text(line, margin, currentY);
      currentY += fontSize * 0.35;
    });
    
    currentY += 5;
  };
  
  // Page de garde
  addTextToPDF('COLLECTION DE SCÉNARIOS', 20, true);
  addTextToPDF(`${scripts.length} scénario${scripts.length > 1 ? 's' : ''} inclus`, 12);
  addTextToPDF(`Exporté le ${new Date().toLocaleDateString('fr-FR')}`, 10);
  
  scripts.forEach((script, index) => {
    // Nouvelle page pour chaque script (sauf le premier)
    if (!isFirstScript) {
      pdf.addPage();
      currentY = margin;
    } else {
      currentY += 20;
    }
    isFirstScript = false;
    
    // Titre du script
    addTextToPDF(`${index + 1}. ${script.title}`, 14, true);
    addTextToPDF(`Genre: ${script.genre} | Âge: ${script.age_range} | Thème: ${script.theme}`, 10);
    
    if (script.custom_idea) {
      addTextToPDF(`Idée: ${script.custom_idea}`, 10);
    }
    
    currentY += 10;
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    
    addTextToPDF(script.content, 10);
  });
  
  // Pied de page
  const totalPages = pdf.internal.pages.length - 1; // -1 car le premier élément est null
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Généré par ScriptAI - Page ${i} sur ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  pdf.save('mes_scenarios.pdf');
};
