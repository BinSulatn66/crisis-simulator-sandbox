export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entity, crisis, capex, raror, srb } = req.body;
  const apiKey = process.env.GROK_API_KEY;

  console.log("GROK_API_KEY presence check:", !!apiKey);

  if (!apiKey) {
    return res.status(500).json({ error: 'xAI API key (GROK_API_KEY) not configured on Vercel environment' });
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
    console.log("Calling xAI API...");
    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "grok-2",
        messages: [
          { role: "system", content: "You are a world-class strategic consultant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await response.json();
    console.log("xAI API response status:", response.status);

    if (response.ok) {
      const text = data.choices?.[0]?.message?.content;
      if (text) {
        return res.status(200).json({ report: text });
      }
    }

    console.error("xAI API error details:", JSON.stringify(data));
    res.status(response.status).json({
      error: 'xAI API call failed',
      details: data
    });

  } catch (err) {
    console.error("Runtime error:", err.message);
    res.status(500).json({ error: 'Runtime error', details: err.message });
  }
}
