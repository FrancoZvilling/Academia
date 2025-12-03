import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FaFileUpload, FaSpinner, FaFilePdf, FaDownload, FaInfoCircle, FaFileWord, FaCopy, FaStar, FaClipboardList, FaCloudUploadAlt, FaCheckCircle, FaTimesCircle, FaRedo, FaArrowRight } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { register: registerExam, handleSubmit: handleSubmitExam, getValues, reset: resetExam, watch: watchExam } = useForm();

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrected, setIsCorrected] = useState(false);
  const [score, setScore] = useState(0);

  const selectedFile = watchFile('pdfFile');
  const fileName = selectedFile && selectedFile.length > 0 ? selectedFile[0].name : '';

  // Observamos las respuestas para actualizar la UI en tiempo real
  const userAnswers = watchExam();

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

  const resultRef = useRef(null);
  const firstQuestionRef = useRef(null);

  const onCorrectExam = () => {
    const currentAnswers = getValues();
    let correctAnswers = 0;
    questions.forEach((q, index) => {
      if (currentAnswers[`question_${index}`] === q.answer) {
        correctAnswers++;
      }
    });
    const finalScore = (correctAnswers / questions.length) * 10;
    setScore(finalScore);
    setIsCorrected(true);

    // Scroll suave hacia el resultado
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleRetry = () => {
    setIsCorrected(false);
    setScore(0);
    // Scroll suave hacia la primera pregunta
    setTimeout(() => {
      firstQuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleNewExam = () => {
    setQuestions([]);
    setIsCorrected(false);
    setScore(0);
    resetExam();
    resetFile();
  };

  const getOptionStyle = (questionIndex, optionLetter) => {
    const userAnswer = userAnswers[`question_${questionIndex}`];
    const isSelected = userAnswer === optionLetter;

    if (isCorrected) {
      const correctAnswer = questions[questionIndex].answer;

      if (optionLetter === correctAnswer) {
        return 'bg-green-100 border-green-500 text-green-800 dark:bg-green-900/30 dark:border-green-500 dark:text-green-300 ring-1 ring-green-500';
      }
      if (isSelected && optionLetter !== correctAnswer) {
        return 'bg-red-100 border-red-500 text-red-800 dark:bg-red-900/30 dark:border-red-500 dark:text-red-300 ring-1 ring-red-500';
      }
      return 'opacity-50 border-transparent';
    }

    if (isSelected) {
      return 'bg-primary/10 border-primary text-primary ring-1 ring-primary';
    }

    return 'bg-surface-50 border-surface-300 hover:bg-surface-200 hover:border-primary/50';
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
      {!questions.length && (
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
      )}

      {isLoading && (<div className="text-center p-8"><FaSpinner className="animate-spin text-primary mx-auto" size={48} /><div className="mt-4 text-text-secondary flex flex-wrap items-center justify-center gap-1 w-full max-w-full px-4"><span>Generando un nuevo examen con</span><span className="font-semibold truncate max-w-[15rem] sm:max-w-md" title={fileName}>"{fileName}"</span><span>...</span></div></div>)}

      {questions.length > 0 && !isLoading && (
        <div className="animate-fade-in max-w-3xl mx-auto">

          {/* Cabecera del Examen */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-text-primary">Examen de Práctica</h3>
            <button onClick={handleNewExam} className="btn btn-sm btn-ghost text-text-secondary">
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmitExam(onCorrectExam)} className="space-y-6">
            {questions.map((q, index) => (
              <motion.div
                key={index}
                ref={index === 0 ? firstQuestionRef : null}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-5 sm:p-6 bg-surface-100 rounded-2xl shadow-sm border border-surface-200"
              >
                <div className="flex gap-3 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <p className="font-bold text-lg text-text-primary leading-tight pt-1">{q.question}</p>
                </div>

                <div className="space-y-3 pl-0 sm:pl-11">
                  {q.options.map((option, optionIndex) => {
                    const optionLetter = String.fromCharCode(97 + optionIndex);
                    const styleClass = getOptionStyle(index, optionLetter);
                    const isCorrect = isCorrected && optionLetter === q.answer;
                    const isWrong = isCorrected && userAnswers[`question_${index}`] === optionLetter && optionLetter !== q.answer;

                    return (
                      <label
                        key={optionIndex}
                        className={`relative flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${styleClass}`}
                      >
                        <input
                          type="radio"
                          {...registerExam(`question_${index}`, { required: true })}
                          value={optionLetter}
                          className="hidden" // Ocultamos el radio nativo
                          disabled={isCorrected}
                        />

                        <span className="font-bold text-lg mr-3 text-text-secondary group-hover:text-primary transition-colors">
                          {optionLetter.toUpperCase()}.
                        </span>

                        <div className="flex-grow font-medium">{option}</div>

                        {/* Iconos de Feedback */}
                        {isCorrect && <FaCheckCircle className="text-green-600 text-xl ml-2 flex-shrink-0" />}
                        {isWrong && <FaTimesCircle className="text-red-500 text-xl ml-2 flex-shrink-0" />}
                      </label>
                    );
                  })}
                </div>
              </motion.div>
            ))}

            {/* Resultado Final (Si está corregido) - MOVIDO AL FINAL */}
            {isCorrected && (
              <motion.div
                ref={resultRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-surface-100 rounded-2xl shadow-lg border border-surface-200 text-center relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 w-full h-2 ${score >= 6 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <h4 className="text-lg font-medium text-text-secondary mb-2">Tu Calificación</h4>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className={`text-5xl font-extrabold ${score >= 6 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {score.toFixed(1)}
                  </span>
                  <span className="text-2xl text-text-secondary font-bold">/ 10</span>
                </div>
                <p className="text-lg mb-6 font-medium">
                  {score === 10 ? "¡Perfecto! 🏆 Eres un experto." :
                    score >= 8 ? "¡Excelente trabajo! 🌟 Estás muy bien preparado." :
                      score >= 6 ? "¡Aprobado! 👍 Pero puedes mejorar." :
                        "A seguir estudiando 📚. ¡Tú puedes!"}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={handleRetry} className="btn btn-outline gap-2">
                    <FaRedo /> Intentar de Nuevo
                  </button>
                  <button onClick={handleNewExam} className="btn bg-primary hover:bg-primary/90 text-white border-none gap-2 shadow-lg shadow-primary/20">
                    <FaFileUpload /> Generar Otro Examen
                  </button>
                </div>
              </motion.div>
            )}

            {!isCorrected && (
              <div className="sticky bottom-4 z-10 pt-4">
                <button
                  type="submit"
                  className={`btn w-full btn-lg shadow-xl rounded-xl text-lg font-bold transition-all duration-300 ${Object.entries(userAnswers).filter(([k, v]) => k.startsWith('question_') && v).length === questions.length
                    ? 'bg-primary hover:bg-primary/90 text-white border-none shadow-primary/30'
                    : 'btn-secondary bg-secondary border-secondary text-text-accent hover:bg-secondary/80'
                    }`}
                >
                  Corregir Examen <FaArrowRight className="ml-2" />
                </button>
              </div>
            )}
          </form>
        </div>
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
