
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

  const prompt = "You are a world-class strategic consultant. Provide a deep, executive analysis in Arabic for:\n" +
                 "Entity: " + entity + "\n" +
                 "Crisis: " + crisis + "\n" +
                 "CapEx: " + capex + "%\n" +
                 "RAROR: " + raror + "\n" +
                 "SRB: " + srb;

  try {
    const apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=" + apiKey;
    console.log("Initiating request to Gemini API...");
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Google API Error Payload:", JSON.stringify(data));
      return res.status(response.status).json({ 
        error: "Google API Error", 
        details: data,
        status: response.status 
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Error: No content in response';
    res.status(200).json({ report: text });
  } catch (error) {
    console.error("Runtime Exception:", error.message);
    res.status(500).json({ error: 'Failed to communicate with Gemini API', details: error.message });
  }
}
