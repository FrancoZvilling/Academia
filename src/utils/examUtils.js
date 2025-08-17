// src/utils/examUtils.js

/**
 * Recibe un array de preguntas de examen y devuelve una nueva versión
 * con las opciones de cada pregunta barajadas aleatoriamente y la respuesta correcta actualizada.
 * @param {Array<object>} exam - El array de preguntas original de la IA.
 * @returns {Array<object>} - El nuevo array de preguntas con las opciones barajadas.
 */
export function shuffleExam(exam) {
  if (!exam || !Array.isArray(exam)) {
    return [];
  }

  return exam.map((question) => {
    // 1. Hacemos una copia de las opciones para no modificar el original
    const options = [...question.options];
    
    // 2. Identificamos cuál era el texto de la respuesta correcta original
    // 'a'.charCodeAt(0) = 97. 'a'->0, 'b'->1, etc.
    const originalCorrectIndex = question.answer.charCodeAt(0) - 97;
    const correctAnswerText = question.options[originalCorrectIndex];
    
    // 3. Barajamos el array de opciones (algoritmo de Fisher-Yates)
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]]; // Intercambio de elementos
    }

    // 4. Encontramos la nueva posición (índice) del texto de la respuesta correcta
    const newCorrectIndex = options.indexOf(correctAnswerText);
    
    // 5. Convertimos ese nuevo índice de vuelta a una letra ('a', 'b', 'c', 'd')
    const newAnswerLetter = String.fromCharCode(97 + newCorrectIndex);

    // 6. Devolvemos la pregunta con las opciones barajadas y la nueva respuesta correcta
    return {
      ...question,
      options: options,
      answer: newAnswerLetter
    };
  });
}