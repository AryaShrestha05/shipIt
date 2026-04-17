require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  console.log('Asking Gemini...');
  const result = await model.generateContent('Say hello in one sentence.');
  console.log('Gemini says:', result.response.text());
}

testGemini().catch(err => console.error('Error:', err.message));
