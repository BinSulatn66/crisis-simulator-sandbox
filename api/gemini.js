export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entity, crisis, capex, raror, srb } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

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

  // List of potential endpoints to try for maximum resilience
  const endpoints = [
    { url: "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent", label: "v1-flash" },
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", label: "v1beta-flash" },
    { url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent", label: "v1beta-flash-latest" }
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`Attempting Gemini API (${endpoint.label})...`);
      
      const response = await fetch(`${endpoint.url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

      // Clone response to handle potential empty bodies or non-json
      const responseClone = response.clone();
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { rawText: await responseClone.text() };
      }

      if (response.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          console.log(`Success with ${endpoint.label}`);
          return res.status(200).json({ report: text });
        }
      }

      console.warn(`${endpoint.label} failed with status ${response.status}:`, JSON.stringify(data));
      lastError = { label: endpoint.label, status: response.status, data };

    } catch (err) {
      console.error(`Runtime error on ${endpoint.label}:`, err.message);
      lastError = { label: endpoint.label, error: err.message };
    }
  }

  res.status(lastError?.status || 500).json({ 
    error: 'All Gemini API endpoints failed', 
    details: lastError 
  });
}
