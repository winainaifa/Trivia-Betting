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
        
        // Extract query parameters for dynamic topic generation to prevent duplicates
        const urlObj = new URL(req.url || '', `http://${req.headers?.host || 'localhost'}`);
        const queryParams = Object.fromEntries(urlObj.searchParams.entries());
        const topics = req.query?.topics || queryParams.topics || "";
        
        const prompt = `สร้างคำถามทายปัญหาความรู้ทั่วไปและข้อเท็จจริงที่น่าสนใจเกี่ยวกับเรื่อง: "${decodeURIComponent(topics || 'ความรู้รอบตัวทั่วโลก')}" จำนวน 10 ข้อ ` +
                       `โดยกำหนดให้เรียงลำดับระดับความยากจากง่ายที่สุดไปยากที่สุดทีละขั้นอย่างเคร่งครัดตามดัชนีข้อดังนี้:\n` +
                       `- ข้อ 1-2 (ระดับง่ายมาก): เป็นข้อความจริงทั่วไปที่คนส่วนใหญ่คุ้นเคยและตอบได้ทันที\n` +
                       `- ข้อ 3-4 (ระดับง่าย): ต้องคิดทบทวนเล็กน้อย แต่ยังเป็นเรื่องระดับพื้นฐาน\n` +
                       `- ข้อ 5-6 (ระดับปานกลาง): เริ่มเป็นความรู้เฉพาะทางขึ้นมาอีกระดับ ต้องใช้การวิเคราะห์หรือการจำเรื่องรอง\n` +
                       `- ข้อ 7-8 (ระดับยาก): มีความเจาะลึกเฉพาะเรื่อง มักเป็นข้อมูลที่คนทั่วไปไม่ค่อยรู้\n` +
                       `- ข้อ 9 (ระดับยากมาก): ความรู้เชิงลึกแบบแฟนพันธุ์แท้หรือระดับผู้ศึกษาในด้านนั้นๆ\n` +
                       `- ข้อ 10 (ระดับเซียนยากที่สุด): เรื่องลึกลับ แปลกประหลาด หรือยากที่สุดระดับท็อปที่น้อยคนจะตอบได้ถูกต้อง\n\n` +
                       `**กฎสำคัญที่ห้ามละเมิดเด็ดขาด:**\n` +
                       `1. ห้ามสลับลำดับความยาก ความยากต้องไล่ระดับเพิ่มขึ้นเรื่อยๆ เสมอ (ข้อ 1 ง่ายสุด -> 2 -> 3 -> ... -> 10 ยากสุด)\n` +
                       `2. คำถามต้องแปลกใหม่ สร้างสรรค์ และมีความหลากหลายสูง (ห้ามถามเรื่องซ้ำซากจำเจ เช่น เมืองหลวงประเทศฝรั่งเศส, แม่น้ำที่ยาวที่สุดในโลก หรือผู้คิดค้นหลอดไฟ)\n` +
                       `3. ตัวเลือก 4 ข้อต้องมีความเป็นไปได้และใกล้เคียงกัน ไม่ใช่ตัวเลือกหลอกแบบเห็นได้ชัด\n` +
                       `4. ให้ผลลัพธ์เป็น JSON Array เท่านั้น ไม่มีข้อความอื่นปน:\n` +
                       `[\n` +
                       `  {\n` +
                       `    "question": "คำถาม...",\n` +
                       `    "options": ["ตัวเลือก 0", "ตัวเลือก 1", "ตัวเลือก 2", "ตัวเลือก 3"],\n` +
                       `    "answer": 0\n` +
                       `  }\n` +
                       `]\n` +
                       `ฟิลด์ answer ต้องเป็นเลขจำนวนเต็มดัชนี 0 ถึง 3 เท่านั้น ห้ามส่งเครื่องหมาย markdown codeblock (เช่น \`\`\`json ...) ให้ตอบกลับเฉพาะ JSON array ตรงๆ`;
        
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
