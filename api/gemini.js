export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entity, crisis, capex, raror, srb } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  console.log("Internal API Key Check:", apiKey ? "Present (Starts with " + apiKey.substring(0, 4) + ")" : "Missing");

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on Vercel environment' });
  }

  const prompt = "You are a world-class strategic consultant (McKinsey/BCG style). Provide a deep, executive analysis in Arabic for the following scenario:\n" +
                 "Entity: " + entity + "\n" +
                 "Crisis Type: " + crisis + "\n" +
                 "Investment Hedging (CapEx): " + capex + "%\n" +
                 "RAROR Score: " + raror + "\n" +
                 "SRB Buffer: " + srb + "\n\n" +
                 "Structure the report with these sections in Arabic:\n" +
                 "1. Executive Assessment (التقييم التنفيذي الاستراتيجي)\n" +
                 "2. Mathematical Modeling Analysis (النمذجة الرياضية وتحليل البيانات)\n" +
                 "3. Response Architecture (هيكلية الاستجابة عبر الآفاق الزمنية)\n" +
                 "4. Vision 2030 Mapping (الموائمة مع برامج رؤية المملكة 2030)\n\n" +
                 "Use professional, authoritative, and sophisticated Arabic terminology.";

  try {
    // Standard endpoint for Gemini 1.5 Flash
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
    
    console.log("Initiating request to Gemini API:", apiUrl.split('?')[0]);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Google API Error Payload:", JSON.stringify(data));
      return res.status(response.status).json({ 
        error: "Google API Error", 
        details: data.error || data,
        status: response.status 
      });
    }

    const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] ? data.candidates[0].content.parts[0].text : 'Error: No content generated';
    
    res.status(200).json({ report: text });
  } catch (error) {
    console.error("Runtime Exception:", error.message);
    res.status(500).json({ error: 'Failed to communicate with Gemini API', details: error.message });
  }
}
