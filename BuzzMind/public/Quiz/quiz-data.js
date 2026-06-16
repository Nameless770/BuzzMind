/* =============================================
   quiz-data.js
   - Simulated quiz data (no backend)
   - Shared security/sanitization utilities
   - Used by both student-quiz.js and professor-quiz.js
   ============================================= */

// ============================================================
// SECURITY UTILITIES
// These are simple but clearly intentional for a student project.
// ============================================================

/**
 * Safely set text content — NEVER use innerHTML with user input.
 * This prevents XSS by treating content as plain text only.
 * @param {HTMLElement} el - The DOM element to update
 * @param {string} text - The text to set
 */
function safeSetText(el, text) {
  if (el) el.textContent = String(text);
}

/**
 * Validate an image URL before using it.
 * Only allows http:// or https:// URLs to block javascript: URIs,
 * data: URIs, and other dangerous schemes.
 * @param {string} url
 * @returns {boolean}
 */
function isValidImageUrl(url) {
  if (typeof url !== 'string') return false;
  const trimmed = url.trim();
  // Only allow http and https protocols
  return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(trimmed);
}

/**
 * Sanitize a plain-text user input (name, pin, etc.).
 * Strips anything that isn't alphanumeric, spaces, or basic punctuation.
 * @param {string} input
 * @returns {string}
 */
function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  // Remove HTML tags and limit length
  return input
    .replace(/<[^>]*>/g, '')        // strip any HTML tags
    .replace(/[^\w\s.,!?'-]/g, '')  // keep safe characters only
    .trim()
    .slice(0, 100);                  // max 100 characters
}


// ============================================================
// QUIZ DATA
// In a real app this would come from a backend API.
// For the simulation we hard-code it here and both pages
// import this file.
// ============================================================

const QUIZ_DATA = {
  title: "World Geography Quiz",
  totalTime: 20, // total quiz time in MINUTES (shared countdown for everyone)

  questions: [
    {
      id: 1,
      text: "What is the capital city of France, known as the \"City of Light\"?",
      // Image URLs go through isValidImageUrl() before being shown
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/640px-Camponotus_flavomarginatus_ant.jpg",
      answers: ["Lyon", "Paris", "Marseille", "Bordeaux"],
      correctIndex: 1 // Paris
    },
    {
      id: 2,
      text: "Which planet is known as the Red Planet?",
      imageUrl: null,
      answers: ["Venus", "Jupiter", "Mars", "Saturn"],
      correctIndex: 2 // Mars
    },
    {
      id: 3,
      text: "What is the largest ocean on Earth?",
      imageUrl: null,
      answers: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correctIndex: 3 // Pacific
    },
    {
      id: 4,
      text: "Which element has the chemical symbol 'O'?",
      imageUrl: null,
      answers: ["Gold", "Oxygen", "Osmium", "Oganesson"],
      correctIndex: 1 // Oxygen
    }
  ]
};

// Simulated list of students in the game session.
// In a real app this would be managed server-side.
const SESSION_STUDENTS = [
  { name: "Alex", score: 0 },
  { name: "Sam", score: 0 },
  { name: "Jamie", score: 0 },
  { name: "Casey", score: 0 },
  { name: "Riley", score: 0 },
  { name: "Jordan", score: 0 },
  { name: "Skyler", score: 0 },
  { name: "Morgan", score: 0 }
];

// Answer shape icons matching the Kahoot-style design (image 10)
const ANSWER_SHAPES = ['▲', '◀', '●', '■'];
const ANSWER_CLASSES = ['answer-a', 'answer-b', 'answer-c', 'answer-d'];