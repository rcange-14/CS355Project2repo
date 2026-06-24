var express = require('express');
var router = express.Router();
const { requireAuth } = require('../auth');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash'; // change here if your key only supports a different tier
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SUBJECTS = ['Math', 'Science', 'History', 'English', 'Computer Science'];

// GET /tutor - show the subject + question form (only if logged in)
router.get('/', requireAuth, function (req, res) {
  res.render('tutor', {
    name: req.session.name,
    subjects: SUBJECTS,
    answer: null,
    selectedSubject: null,
    question: null,
    error: null,
  });
});

// POST /tutor/ask - send the question + subject to Gemini, render the answer
router.post('/ask', requireAuth, async function (req, res) {
  const { subject, question } = req.body;

  if (!question || !question.trim()) {
    return res.render('tutor', {
      name: req.session.name,
      subjects: SUBJECTS,
      answer: null,
      selectedSubject: subject,
      question: question,
      error: 'Please enter a question.',
    });
  }

  try {
    const prompt = `You are a friendly, patient tutor helping a student with ${subject}. Explain clearly and simply, with an example if helpful. Student's question: ${question}`;

    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      throw new Error('Gemini API request failed');
    }

    const data = await response.json();
    const answer =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I could not generate an answer for that.';

    res.render('tutor', {
      name: req.session.name,
      subjects: SUBJECTS,
      answer: answer,
      selectedSubject: subject,
      question: question,
      error: null,
    });
  } catch (e) {
    console.error(e);
    res.render('tutor', {
      name: req.session.name,
      subjects: SUBJECTS,
      answer: null,
      selectedSubject: subject,
      question: question,
      error: 'Something went wrong reaching the tutor. Please try again.',
    });
  }
});

module.exports = router;
