import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaFileUpload, FaSpinner, FaFilePdf, FaDownload, FaInfoCircle, FaFileWord, FaCopy, FaStar, FaClipboardList, FaCloudUploadAlt } from 'react-icons/fa';
import * as pdfjsLib from 'pdfjs-dist';
import { callGenerateSummary, callGenerateExam } from '../services/firestoreService';
import { marked } from 'marked';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import Modal from '../components/ui/Modal';
import AIInstructions from '../components/ui/AIInstructions';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { shuffleExam } from '../utils/examUtils';

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
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <FaFilePdf className="text-3xl text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-text-primary">Generador de Resúmenes</h2>
        <p className="text-text-secondary max-w-xl mx-auto text-lg mb-4">
          Transforma tus apuntes PDF en resúmenes estructurados y listos para estudiar en segundos.
        </p>
        <button
          onClick={() => setIsInstructionsModalOpen(true)}
          className="btn btn-ghost btn-sm text-primary hover:bg-primary/10 font-medium"
        >
          <FaInfoCircle className="mr-2" />
          Ver instrucciones y consejos
        </button>
      </div>

      {/* --- FORMULARIO REDISEÑADO (UPLOAD ZONE) --- */}
      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 animate-fade-in">
        <div className="mb-6">
          <label
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${fileName ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50 dark:border-gray-600 dark:hover:border-primary dark:hover:bg-gray-800'}`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full max-w-full">
              {fileName ? (
                <>
                  <FaFilePdf className="text-5xl text-red-500 mb-3 animate-bounce-short" />
                  <p className="mb-2 text-lg font-semibold text-text-primary truncate max-w-[15rem] sm:max-w-md px-4 text-center" title={fileName}>{fileName}</p>
                  <p className="text-sm text-text-secondary">Clic para cambiar archivo</p>
                </>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-5xl text-gray-400 mb-3" />
                  <p className="mb-2 text-lg font-semibold text-text-primary">Haz clic para subir tu PDF</p>
                  <p className="text-xs text-text-secondary">Soporta archivos PDF</p>
                </>
              )}
            </div>
            <input type="file" {...register("pdfFile")} accept="application/pdf" className="hidden" />
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-secondary bg-secondary border-secondary text-text-accent hover:bg-primary w-full btn-lg text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 rounded-xl"
          disabled={isLoading || !fileName}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner"></span>
              <span className="ml-2">Analizando Documento...</span>
            </>
          ) : (
            'Generar Resumen'
          )}
        </button>
      </form>

      {isLoading && (<div className="text-center p-8"><FaSpinner className="animate-spin text-primary mx-auto" size={48} /><div className="mt-4 text-text-secondary flex flex-wrap items-center justify-center gap-1 w-full max-w-full px-4"><span>Analizando</span><span className="font-semibold truncate max-w-[15rem] sm:max-w-md" title={fileName}>"{fileName}"</span><span>y resumiendo... Por favor, espera.</span></div></div>)}
      {summary && (
        <div className="mt-8 animate-fade-in">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <h2 className="text-2xl font-bold">Tu Resumen:</h2>
            <div className="flex items-center gap-2"><button onClick={handleCopyText} className="btn btn-ghost btn-sm" title="Copiar Texto"><FaCopy className="mr-2" />Copiar</button><button onClick={handleDownloadDOCX} className="btn btn-secondary bg-secondary border-secondary text-text-accent hover:bg-primary" title="Descargar como Word"><FaFileWord className="mr-2" />Descargar .docx</button></div>
          </div>
          <div ref={summaryRef} className="p-6 bg-surface-100 rounded-lg shadow-md"><div className="prose dark:prose-invert max-w-none [&_*]:!text-text-primary dark:[&_*]:!text-text-prim" dangerouslySetInnerHTML={{ __html: marked.parse(summary) }} /></div>
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
    if (!file) {
      toast.warn("Por favor, selecciona un archivo PDF.");
      return;
    }

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

      const shuffledQuestions = shuffleExam(parsedQuestions);

      setQuestions(shuffledQuestions);

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
      <div className="text-center mb-10 animate-fade-in">
        <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-4">
          <FaClipboardList className="text-3xl text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-3 text-text-primary">Generador de Exámenes</h2>
        <p className="text-text-secondary max-w-xl mx-auto text-lg mb-4">
          Sube tu material de estudio y la IA generará un examen de opción múltiple para que pongas a prueba tus conocimientos.
        </p>
      </div>

      {/* --- FORMULARIO REDISEÑADO (UPLOAD ZONE) --- */}
      <form onSubmit={handleSubmitFile(onGenerateExam)} className="mb-8 animate-fade-in">
        <div className="mb-6">
          <label
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${fileName ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50 dark:border-gray-600 dark:hover:border-primary dark:hover:bg-gray-800'}`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full max-w-full">
              {fileName ? (
                <>
                  <FaFilePdf className="text-5xl text-red-500 mb-3 animate-bounce-short" />
                  <p className="mb-2 text-lg font-semibold text-text-primary truncate max-w-[15rem] sm:max-w-md px-4 text-center" title={fileName}>{fileName}</p>
                  <p className="text-sm text-text-secondary">Clic para cambiar archivo</p>
                </>
              ) : (
                <>
                  <FaCloudUploadAlt className="text-5xl text-gray-400 mb-3" />
                  <p className="mb-2 text-lg font-semibold text-text-primary">Haz clic para subir tu PDF</p>
                  <p className="text-xs text-text-secondary">Soporta archivos PDF</p>
                </>
              )}
            </div>
            <input type="file" {...registerFile("pdfFile")} accept="application/pdf" className="hidden" />
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-secondary bg-secondary border-secondary text-text-accent hover:bg-primary w-full btn-lg text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 rounded-xl"
          disabled={isLoading || !fileName}
        >
          {isLoading ? (
            <>
              <span className="loading loading-spinner"></span>
              <span className="ml-2">Creando Examen...</span>
            </>
          ) : (
            'Generar Examen'
          )}
        </button>
      </form>

      {isLoading && (<div className="text-center p-8"><FaSpinner className="animate-spin text-primary mx-auto" size={48} /><div className="mt-4 text-text-secondary flex flex-wrap items-center justify-center gap-1 w-full max-w-full px-4"><span>Generando un nuevo examen con</span><span className="font-semibold truncate max-w-[15rem] sm:max-w-md" title={fileName}>"{fileName}"</span><span>...</span></div></div>)}

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

      {/* --- PESTAÑAS MODERNAS TIPO TWITTER --- */}
      <div className="flex w-full border-b border-gray-200 dark:border-gray-700 mb-6">
        <div
          className={`flex-1 text-center py-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 relative ${activeTab === 'summarizer' ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}
          onClick={() => setActiveTab('summarizer')}
        >
          Resúmenes
          {activeTab === 'summarizer' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-primary rounded-t-full"></div>
          )}
        </div>
        <div
          className={`flex-1 text-center py-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 relative ${activeTab === 'exam' ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'}`}
          onClick={() => setActiveTab('exam')}
        >
          Modelos de Parcial
          {activeTab === 'exam' && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-primary rounded-t-full"></div>
          )}
        </div>
      </div>

      <div>
        {activeTab === 'summarizer' && <SummarizerTab />}
        {activeTab === 'exam' && <ExamGeneratorTab />}
      </div>
    </div>
  );
};

export default AIPage;
