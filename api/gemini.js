export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { entity, crisis, capex, raror, srb } = req.body;
    
    // DeepSeek Configuration with fallback key
    const apiKey = process.env.DEEPSEEK_API_KEY || "sk-b6f1388a48a946d5bbcc33d108cb3cfb";
    
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
        console.log("Calling DeepSeek API...");
        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "You are a world-class strategic consultant." },
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            const text = data.choices?.[0]?.message?.content;
            if (text) {
                return res.status(200).json({ report: text });
            }
        }

        console.error("DeepSeek API error details:", JSON.stringify(data));
        res.status(response.status).json({ error: 'DeepSeek API call failed', details: data });
    } catch (err) {
        console.error("Runtime error:", err.message);
        res.status(500).json({ error: 'Runtime error', details: err.message });
    }
}