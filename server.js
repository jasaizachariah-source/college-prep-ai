require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Configuration, OpenAIApi } = require('openai');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// OpenAI Setup
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Data directory
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Helper: Read JSON file
function readJSON(filename) {
  try {
    return JSON.parse(fs.readFileSync(path.join(dataDir, filename), 'utf8'));
  } catch {
    return {};
  }
}

// Helper: Write JSON file
function writeJSON(filename, data) {
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2));
}

// ==================== ROUTES ====================

// 1. MOCK INTERVIEW
app.post('/api/interview', async (req, res) => {
  try {
    const { schoolName, questionNumber } = req.body;
    
    const prompt = `You are a college admissions interviewer for ${schoolName}. 
    Generate interview question #${questionNumber} (out of 5). 
    Make it specific and thoughtful. Just ask the question, nothing else.`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    });

    res.json({ question: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. INTERVIEW FEEDBACK
app.post('/api/interview-feedback', async (req, res) => {
  try {
    const { schoolName, question, answer } = req.body;

    const prompt = `You are a college admissions expert. 
    The student is interviewing for ${schoolName}.
    Question: "${question}"
    Student's Answer: "${answer}"
    
    Provide:
    1. Score (1-10)
    2. What they did well
    3. How to improve
    4. Better example answer
    
    Be constructive and encouraging.`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    res.json({ feedback: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. ESSAY FEEDBACK
app.post('/api/essay-feedback', async (req, res) => {
  try {
    const { essay, essayType } = req.body;

    const prompt = `You are an expert college essay coach. Review this ${essayType} essay:
    
    "${essay}"
    
    Provide:
    1. Score (1-10)
    2. Strengths
    3. Areas to improve
    4. Specific suggestions for revision
    5. Tips for making it more compelling
    
    Be detailed and constructive.`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    });

    res.json({ feedback: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. COLLEGE READINESS TEST
app.post('/api/readiness-test', async (req, res) => {
  try {
    const { questionNumber } = req.body;

    const prompt = `Generate college readiness assessment question #${questionNumber} (out of 10).
    Topics: GPA, SAT/ACT prep, essays, extracurriculars, college research.
    Format: "Question: [question]\nA) [option]\nB) [option]\nC) [option]\nD) [option]\nCorrect Answer: [letter]"`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
    });

    res.json({ question: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. SCHOLARSHIP ADVICE
app.post('/api/scholarship-advice', async (req, res) => {
  try {
    const { topic } = req.body;

    const prompt = `You are a scholarship expert. Provide advice on: ${topic}
    
    Include:
    1. Key tips
    2. Common mistakes to avoid
    3. Essay tips if applicable
    4. Resources to check
    
    Be practical and actionable.`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
    });

    res.json({ advice: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. AI EDUCATION SPECIALIST (Chat)
app.post('/api/education-chat', async (req, res) => {
  try {
    const { message } = req.body;

    const prompt = `You are an AI education specialist with deep knowledge of:
    - Colleges and universities worldwide
    - College admissions process
    - AI and its impact on the future job market
    - Education trends
    
    User question: "${message}"
    
    Provide helpful, detailed, and encouraging advice.`;

    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
    });

    res.json({ response: response.data.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. GET COLLEGES
app.get('/api/colleges', (req, res) => {
  const colleges = readJSON('colleges.json');
  res.json(colleges);
});

// 8. SAVE USER PROGRESS
app.post('/api/progress', (req, res) => {
  try {
    const progress = readJSON('user-progress.json');
    const newProgress = { ...progress, ...req.body, timestamp: new Date() };
    writeJSON('user-progress.json', newProgress);
    res.json({ success: true, progress: newProgress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 9. GET USER PROGRESS
app.get('/api/progress', (req, res) => {
  const progress = readJSON('user-progress.json');
  res.json(progress);
});

// Server start
app.listen(PORT, () => {
  console.log(`🚀 College Prep AI running on http://localhost:${PORT}`);
  console.log('📚 Features: Mock Interviews, Essays, Scholarships, AI Chat');
});
