export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { entity, crisis, capex, raror, srb } = req.body;
    
    // Gemini Configuration
    const apiKey = process.env.GEMINI_API_KEY;
    
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
        console.log("Calling Gemini API...");
        // Using v1beta for better compatibility with AQ-prefixed keys and Flash model
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048
                }
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
                return res.status(200).json({ report: text });
            }
        }

        console.error("Gemini API error details:", JSON.stringify(data));
        res.status(response.status).json({ error: 'Gemini API call failed', details: data });
    } catch (err) {
        console.error("Runtime error:", err.message);
        res.status(500).json({ error: 'Runtime error', details: err.message });
    }
}