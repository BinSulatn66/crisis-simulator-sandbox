export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entity, crisis, capec, raror, srb } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('CRITICAL: GEMINI_API_KEY is missing from environment variables.');
    return res.status(500).json({ error: 'Gemini API key not configured on Vercel' });
  }

  const prompt = "You are a world-class strategic consultant (McKinsey/BCG style). Provide a deep, executive analysis in Arabic for the following scenario:\n" +
                 "Entity: " + entity + "\n" +
                 "Crisis Type: " + crisis + "\n" +
                 "Investment Hedging (CapEx): " + capec + "%\n" +
                 "RAROR Score: " + raror + "\n" +
                 "SRB Buffer: " + srb + "\n\n" +
                 "Structure the report with these sections in Arabic:\n" +
                 "1. Executive Assessment (التقييم التنفيذي الاستراتيجي)\n" +
                 "2. Mathematical Modeling Analysis (النمذجة الرياضية وتحليل البيانات)\n" +
                 "3. Response Architecture (هيكلية الاستجابة عبر الآفاق الزمنية)\n" +
                 "4. Vision 2030 Mapping (الموائمة مع برامج رؤية المملكة 2030)\n\n" +
                 "Use professional, authoritative, and sophisticated Arabic terminology.";

  try {
    // Updated to gemini-1.5-flash-latest for better availability and stability
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + apiKey;
    
    console.log('Initiating request to Gemini API:', apiUrl.split('?')[0]);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API Error Response:', JSON.stringify(data));
      return res.status(response.status).json({ 
        error: data.error?.message || 'Gemini API returned an error',
        details: data 
      });
    }

    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0] 
      ? data.candidates[0].content.parts[0].text 
      : 'Error: API response format unexpected.';
    
    res.status(200).json({ report: text });
  } catch (error) {
    console.error('System Exception during Gemini call:', error.message);
    res.status(500).json({ error: 'Failed to communicate with Gemini API: ' + error.message });
  }
}
