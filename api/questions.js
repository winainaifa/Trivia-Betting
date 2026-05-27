// api/questions.js
// Vercel Serverless Function to proxy requests to Gemini API securely

export default async function handler(req, res) {
    // Enable CORS for frontend requests (essential if frontend runs on GitHub Pages)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allows requests from any origin (GitHub Pages, localhost, etc.)
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Handle preflight OPTIONS request from browser CORS precheck
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ 
            error: "Gemini API key is not configured in the Vercel backend environment." 
        });
    }

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
        
        const prompt = "สร้างคำถามทายปัญหาความรู้ทั่วไปเกี่ยวกับประวัติศาสตร์ ภูมิศาสตร์ วิทยาศาสตร์ วัฒนธรรม และข้อเท็จจริงจากทั่วโลกจำนวน 10 ข้อ " +
                       "โดยเรียงลำดับระดับความยากจากง่ายไปยากที่สุด (ข้อ 1 ง่ายที่สุด และค่อยๆ ยากขึ้นจนถึงข้อ 10 ยากที่สุดระดับเซียนตอบ) " +
                       "ให้ผลลัพธ์เป็น JSON Array ที่มีโครงสร้างตรงตามรูปแบบต่อไปนี้เท่านั้น:\n" +
                       "[\n" +
                       "  {\n" +
                       "    \"question\": \"คำถาม...\",\n" +
                       "    \"options\": [\"ตัวเลือก 1\", \"ตัวเลือก 2\", \"ตัวเลือก 3\", \"ตัวเลือก 4\"],\n" +
                       "    \"answer\": 0\n" +
                       "  }\n" +
                       "]\n" +
                       "ฟิลด์ answer ต้องเป็นเลขจำนวนเต็มดัชนี 0 ถึง 3 เท่านั้น ห้ามส่งข้อความคำนำหรือลงท้ายใดๆ หรือเครื่องหมาย markdown codeblock ให้ส่งเฉพาะเนื้อหา JSON อาเรย์ตรงๆ";
        
        const payload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                responseMimeType: "application/json"
            }
        };

        const apiResponse = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (!apiResponse.ok) {
            const errText = await apiResponse.text();
            return res.status(apiResponse.status).json({ 
                error: `Gemini API responded with status ${apiResponse.status}: ${errText}` 
            });
        }

        const data = await apiResponse.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const parsedQuestions = JSON.parse(rawText.trim());

        // Basic verification of structure
        if (!Array.isArray(parsedQuestions) || parsedQuestions.length !== 10) {
            throw new Error("Invalid structure or question count returned from Gemini.");
        }

        // Return the clean JSON array to the client
        return res.status(200).json(parsedQuestions);
    } catch (error) {
        console.error("Backend proxy error:", error);
        return res.status(500).json({ 
            error: "Failed to generate questions: " + error.message 
        });
    }
}
