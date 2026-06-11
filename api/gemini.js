export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entity, crisis, capex, raror, srb } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on Vercel environment' });
  }

  // Detect AQ-prefixed key (Google Cloud Project key)
  const isAQKey = apiKey.startsWith('AQ');
  
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

  // For AQ keys (GCP), we attempt to use the Vertex AI style endpoint structure or 
  // ensure the v1beta endpoint with proper headers is used.
  // Standard AIza keys work with generativelanguage.googleapis.com
  const endpoints = [
    { 
      url: "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent", 
      label: "v1beta-flash" 
    },
    { 
      url: "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent", 
      label: "v1-flash" 
    }
  ];

  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      console.log(`Internal API Key Check: Prefix=${apiKey.substring(0, 3)}... (isAQ=${isAQKey})`);
      console.log(`Attempting Gemini API (${endpoint.label})...`);
      
      const response = await fetch(`${endpoint.url}?key=${apiKey}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          // If it's a GCP key, sometimes the x-goog-api-key header is more reliable
          ...(isAQKey ? { 'x-goog-api-key': apiKey } : {})
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          }
        })
      });

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

  // If we reach here, all attempts failed. 
  // If we have a 403/404 on an AQ key, it likely means the API isn't enabled in the GCP project.
  res.status(lastError?.status || 500).json({ 
    error: 'All Gemini API endpoints failed', 
    details: lastError 
  });
}
