import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaFileUpload, FaSpinner, FaFilePdf, FaDownload, FaInfoCircle, FaFileWord, FaCopy, FaStar } from 'react-icons/fa';
import * as pdfjsLib from 'pdfjs-dist';
import { callGenerateSummary, callGenerateExam } from '../services/firestoreService';
import { marked } from 'marked';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import Modal from '../components/ui/Modal';
import AIInstructions from '../components/ui/AIInstructions';
import { useAuth } from '../contexts/AuthContext'; 
import { Link } from 'react-router-dom';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.mjs`;


// --- Sub-componente para la pestaña de RESÚMENES ---
const SummarizerTab = () => {
  const { register, handleSubmit, reset, watch } = useForm();
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInstructionsModalOpen, setIsInstructionsModalOpen] = useState(false);
  const summaryRef = useRef(null);
  const selectedFile = watch('pdfFile');
  const fileName = selectedFile && selectedFile.length > 0 ? selectedFile[0].name : '';

  const onSubmit = async (data) => {
    const file = data.pdfFile[0];
    if (!file) {
      toast.warn("Por favor, selecciona un archivo PDF.");
      return;
    }
    setIsLoading(true);
    setSummary('');
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(' ');
      }
      if (fullText.trim().length === 0) {
        throw new Error("No se pudo extraer texto del PDF. Puede que sea una imagen escaneada.");
      }
      toast.info("Generando resumen... Esto puede tardar un momento.");
      const generatedSummary = await callGenerateSummary(fullText);
      setSummary(generatedSummary);
      toast.success("¡Resumen generado con éxito!");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Ocurrió un error al procesar el archivo.");
    } finally {
      setIsLoading(false);
    }
  };

 const handleDownloadDOCX = () => {
    if (!summary) return;
    toast.info("Generando .docx...");

    const docChildren = summary.split('\n').filter(line => line.trim() !== '').map(line => {
        const trimmedLine = line.trim();

        // Manejo de encabezados
        if (trimmedLine.startsWith('## ')) {
            return new Paragraph({
                children: [new TextRun({ text: trimmedLine.substring(3), bold: true, size: 32 })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 360, after: 180 }
            });
        }
        if (trimmedLine.startsWith('### ')) {
            return new Paragraph({
                children: [new TextRun({ text: trimmedLine.substring(4), bold: true, size: 28 })],
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 240, after: 120 }
            });
        }
        
        // Manejo de ítems de lista
        if (trimmedLine.startsWith('* ')) {
            return new Paragraph({
                children: parseMarkdownBold(trimmedLine.substring(2)),
                bullet: { level: 0 },
                spacing: { after: 120 }
            });
        }

        // Párrafo normal
        return new Paragraph({
            children: parseMarkdownBold(trimmedLine),
            spacing: { after: 120 }
        });
    });

    // Función para procesar **negritas** en texto
    function parseMarkdownBold(text) {
        const textRuns = [];
        const regex = /\*\*(.+?)\*\*/g;
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            // Texto normal antes de la negrita
            if (match.index > lastIndex) {
                textRuns.push(new TextRun({
                    text: text.substring(lastIndex, match.index),
                    bold: false,
                    size: 24
                }));
            }

            // Texto en negrita (sin los **)
            textRuns.push(new TextRun({
                text: match[1],
                bold: true,
                size: 24
            }));

            lastIndex = regex.lastIndex;
        }

        // Texto restante después de la última negrita
        if (lastIndex < text.length) {
            textRuns.push(new TextRun({
                text: text.substring(lastIndex),
                bold: false,
                size: 24
            }));
        }

        return textRuns;
    }

    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [new TextRun({ text: `Resumen de: ${fileName || 'Documento'}`, bold: true, size: 40 })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 480 }
                }),
                ...docChildren
            ],
        }],
    });
    
    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `Resumen - ${fileName.replace('.pdf', '') || 'Estud-IA'}.docx`);
        toast.success(".docx descargado.");
    });
};


  const handleCopyText = () => {
    if (!summary) return;
    const textArea = document.createElement("textarea");
    const plainText = summary.replace(/##\s|###\s/g, '').replace(/\*\s/g, '• ').replace(/\*\*/g, '');
    textArea.value = plainText;
    document.body.appendChild(textArea);
    textArea.select();
    try { document.execCommand('copy'); toast.success("Resumen copiado al portapapeles."); }
    catch (err) { toast.error("No se pudo copiar el texto."); }
    document.body.removeChild(textArea);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Crear un Resumen</h2>
        <button onClick={() => setIsInstructionsModalOpen(true)} className="btn btn-outline btn-sm">Instrucciones</button>
      </div>
      <p className="text-text-secondary mb-4">Sube un apunte en formato PDF y Gemini creará un resumen para ti.</p>
      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 p-3 rounded-md mb-8">
        <FaInfoCircle className="flex-shrink-0" />
        <span><strong>Aviso:</strong> Este es un servicio en fase BETA. Si recibes un error, puede que nuestros servidores de IA estén ocupados. Por favor, espera unos minutos y vuelve a intentarlo.</span>
      </div>
      
      {/* --- FORMULARIO CORREGIDO CON GRID --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-surface-100 p-6 rounded-lg shadow-md grid grid-cols-[auto,1fr,auto] items-center gap-4 mb-8">
        {/* Columna 1 */}
        <label className="btn btn-primary bg-primary border-primary text-text-accent w-full sm:w-auto">
            <FaFileUpload className="mr-2" />
            <span>{fileName ? 'Cambiar PDF' : 'Seleccionar PDF'}</span>
            <input type="file" {...register("pdfFile")} accept="application/pdf" className="hidden" />
        </label>
        
        {/* Columna 2 */}
        {fileName ? (
          <div className="flex items-center gap-2 text-text-secondary text-sm min-w-0">
            <FaFilePdf className="text-red-500 flex-shrink-0" />
            <span className="truncate" title={fileName}>{fileName}</span>
          </div>
        ) : (
            <div></div> // Placeholder para mantener la estructura de la grilla
        )}

        {/* Columna 3 */}
        <button type="submit" className="btn btn-secondary bg-secondary border-secondary  hover:bg-primary" disabled={isLoading || !fileName}>
            {isLoading ? <span className="loading loading-spinner"></span> : 'Generar Resumen'}
        </button>
      </form>
      
      {isLoading && (<div className="text-center p-8"><FaSpinner className="animate-spin text-primary mx-auto" size={48} /><p className="mt-4 text-text-secondary">Analizando "{fileName}" y resumiendo... Por favor, espera.</p></div>)}
      {summary && (
        <div className="mt-8 animate-fade-in">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-2xl font-bold">Tu Resumen:</h2>
            <div className="flex items-center gap-2"><button onClick={handleCopyText} className="btn btn-ghost btn-sm" title="Copiar Texto"><FaCopy className="mr-2" />Copiar</button><button onClick={handleDownloadDOCX} className="btn btn-secondary bg-secondary border-secondary text-text-accent hover:bg-primary" title="Descargar como Word"><FaFileWord className="mr-2" />Descargar .docx</button></div>
          </div>
          <div ref={summaryRef} className="p-6 bg-surface-100 rounded-lg shadow-md"><div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: marked.parse(summary) }} /></div>
        </div>
      )}
      <Modal isOpen={isInstructionsModalOpen} onClose={() => setIsInstructionsModalOpen(false)} title="Guía de Uso de la IA"><div className="max-h-[60vh] overflow-y-auto p-1 pr-4"><AIInstructions /></div></Modal>
    </>
  );
};




// --- Sub-componente para la pestaña de MODELOS DE PARCIAL ---
const ExamGeneratorTab = () => {
  const { register: registerFile, handleSubmit: handleSubmitFile, watch: watchFile, reset: resetFile } = useForm();
  const { register: registerExam, handleSubmit: handleSubmitExam, getValues, reset: resetExam } = useForm();

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrected, setIsCorrected] = useState(false);
  const [score, setScore] = useState(0);

  const selectedFile = watchFile('pdfFile');
  const fileName = selectedFile && selectedFile.length > 0 ? selectedFile[0].name : '';

  const onGenerateExam = async (data) => {
    const file = data.pdfFile[0];
    if (!file) { toast.warn("Por favor, selecciona un archivo PDF."); return; }
    setIsLoading(true);
    setQuestions([]);
    setIsCorrected(false);
    setScore(0);
    resetExam();
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map(item => item.str).join(' ');
        }
        toast.info("La IA está generando tu examen...");
        const rawResponse = await callGenerateExam(fullText);
        const firstBracket = rawResponse.indexOf('[');
        const lastBracket = rawResponse.lastIndexOf(']');
        if (firstBracket === -1 || lastBracket === -1) {
            throw new Error("La respuesta de la IA no contiene un formato JSON válido.");
        }
        const jsonString = rawResponse.substring(firstBracket, lastBracket + 1);
        const parsedQuestions = JSON.parse(jsonString);
        setQuestions(parsedQuestions);
        toast.success("¡Examen generado! Es hora de practicar.");
    } catch (error) {
        console.error("Error al procesar el examen:", error);
        if (error instanceof SyntaxError) {
            toast.error("La IA devolvió un formato inesperado. Por favor, inténtalo de nuevo.");
        } else {
            toast.error(error.message || "No se pudo generar el examen.");
        }
    } finally {
        setIsLoading(false);
    }
  };

  const onCorrectExam = () => {
    const userAnswers = getValues();
    let correctAnswers = 0;
    questions.forEach((q, index) => {
      if (userAnswers[`question_${index}`] === q.answer) {
        correctAnswers++;
      }
    });
    const finalScore = (correctAnswers / questions.length) * 10;
    setScore(finalScore);
    setIsCorrected(true);
  };

  const handleRetry = () => {
    resetExam();
    onGenerateExam({ pdfFile: selectedFile });
  };

  const getOptionStyle = (questionIndex, optionLetter) => {
    if (!isCorrected) return '';
    const userAnswer = getValues(`question_${questionIndex}`);
    const correctAnswer = questions[questionIndex].answer;
    if (optionLetter === correctAnswer) return 'bg-success/30 border-success';
    if (optionLetter === userAnswer) return 'bg-error/30 border-error';
    return 'border-transparent';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Crear un Modelo de examen</h2>
      <p className="text-text-secondary mb-4">Sube tu material de estudio y la IA generará un examen de opción múltiple para que pongas a prueba tus conocimientos.</p>
      <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 p-3 rounded-md mb-8">
        <FaInfoCircle className="flex-shrink-0" />
        <span><strong>Aviso:</strong> Este es un servicio en fase BETA. Si recibes un error, puede que nuestros servidores de IA estén ocupados. Por favor, espera unos minutos y vuelve a intentarlo.</span>
      </div>

      {/* --- FORMULARIO CORREGIDO CON GRID --- */}
      <form onSubmit={handleSubmitFile(onGenerateExam)} className="bg-surface-100 p-6 rounded-lg shadow-md grid grid-cols-[auto,1fr,auto] items-center gap-4 mb-8">
        {/* Columna 1 */}
        <label className="btn btn-primary bg-primary border-primary text-text-accent w-full sm:w-auto">
          <FaFileUpload className="mr-2" />
          <span>{fileName ? 'Cambiar PDF' : 'Seleccionar PDF'}</span>
          <input type="file" {...registerFile("pdfFile")} accept="application/pdf" className="hidden" />
        </label>
        
        {/* Columna 2 */}
        {fileName ? (
          <div className="flex items-center gap-2 text-text-secondary text-sm min-w-0">
            <FaFilePdf className="text-red-500 flex-shrink-0" />
            <span className="truncate" title={fileName}>{fileName}</span>
          </div>
        ) : (
            <div></div> // Placeholder
        )}

        {/* Columna 3 */}
        <button type="submit" className="btn btn-secondary bg-secondary border-secondary  hover:bg-primary" disabled={isLoading || !fileName}>
          {isLoading ? <span className="loading loading-spinner"></span> : 'Generar Examen'}
        </button>
      </form>

      {isLoading && (<div className="text-center p-8"><FaSpinner className="animate-spin text-primary mx-auto" size={48} /><p className="mt-4 text-text-secondary">Generando un nuevo examen con "{fileName}"...</p></div>)}

      {questions.length > 0 && !isLoading && (
        <form onSubmit={handleSubmitExam(onCorrectExam)} className="space-y-8 animate-fade-in">
          {questions.map((q, index) => (
            <div key={index} className="p-6 bg-surface-100 rounded-lg shadow-md">
              <p className="font-semibold mb-4">{index + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((option, optionIndex) => {
                  const optionLetter = String.fromCharCode(97 + optionIndex);
                  return (
                    <label key={optionIndex} className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${getOptionStyle(index, optionLetter)}`}>
                      <input type="radio" {...registerExam(`question_${index}`, { required: true })} value={optionLetter} className="radio radio-primary" disabled={isCorrected} />
                      <span>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {!isCorrected ? (
            <button type="submit" className="btn btn-secondary bg-secondary border-secondary text-text-accent hover:bg-primary w-full">Corregir Examen</button>
          ) : (
            <div className="p-6 bg-surface-100 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-bold">Resultado Final</h3>
              <p className={`text-4xl font-extrabold mt-2 ${score >= 7 ? 'text-success' : 'text-error'}`}>{score.toFixed(2)} / 10</p>
              <button type="button" onClick={handleRetry} className="btn btn-outline mt-4">Intentar de Nuevo</button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

// --- Componente principal de la página con PESTAÑAS y MURO DE PAGO ---
const AIPage = () => {
  const [activeTab, setActiveTab] = useState('summarizer');
  const { userData, loading } = useAuth(); // <-- 3. Obtener datos del usuario y estado de carga

  // Mientras se cargan los datos del usuario, mostramos un spinner
  if (loading) {
    return <div className="flex justify-center items-center h-full pt-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
  }

  // --- 4. LÓGICA DEL MURO DE PAGO ---
  // Si tenemos los datos y el plan no es 'premium', mostramos el componente de upgrade
  if (userData && userData.plan !== 'premium') {
    return (
        <div className="text-center p-6 sm:p-10 bg-surface-100 rounded-lg shadow-xl flex flex-col items-center">
            <FaStar className="text-yellow-400 text-5xl mb-4" />
            <h1 className="text-3xl font-bold mb-4">Desbloquea las Funciones de IA</h1>
            <p className="text-text-secondary mb-8 max-w-md">
                Las herramientas de Resúmenes y Modelos de Parcial son exclusivas para usuarios Premium. ¡Lleva tu estudio al siguiente nivel!
            </p>
            <Link to="/premium" className="btn btn-primary btn-lg bg-primary text-text-accent">
                Ver Beneficios Premium
            </Link>
        </div>
    );
  }
  // ------------------------------------

  // Si es premium, mostramos la página normal con las pestañas
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Inteligencia Artificial</h1>
      </div>
      <div role="tablist" className="tabs tabs-boxed bg-surface-100 mb-8">
        <a role="tab" className={`tab tab-lg ${activeTab === 'summarizer' ? 'tab-active !bg-primary !text-text-accent' : 'tab-active'}`} onClick={() => setActiveTab('summarizer')}>
          Resúmenes
        </a>
        <a role="tab" className={`tab tab-lg ${activeTab === 'exam' ? 'tab-active !bg-primary !text-text-accent' : 'tab-active'}`} onClick={() => setActiveTab('exam')}>
          Modelos de Parcial
        </a>
      </div>
      <div>
        {activeTab === 'summarizer' && <SummarizerTab />}
        {activeTab === 'exam' && <ExamGeneratorTab />}
      </div>
    </div>
  );
};

export default AIPage;