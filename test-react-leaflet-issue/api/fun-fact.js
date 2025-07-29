import { GoogleGenerativeAI } from '@google/genai';

export default async function handler(req, res) {
  const API_KEY = process.env.GEMINI_API_KEY;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const prompt = 'Give me a fun fact about landslides';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    console.log(response);
    //const text = response.text();

   // res.status(200).json({ fact: text });
  } catch (error) {
    console.error('Error fetching from Google AI:', error);
    //res.status(500).json({ error: 'Failed to retrieve fact.' });
  }
  return response;
}