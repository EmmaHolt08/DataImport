
export async function getFunFact() {

    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));

    let delay = 1000;
    let retries = 0;
    const maxRetries = 5;

    while (retries < maxRetries)
    {
        try{
            const prompt = 'Give me a fun fact about landslides';
            const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];
            const payload = { contents: chatHistory };
            const apiKey = process.env.REACT_APP_GEMINI_API_KEY;    
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                if (response.status >= 500 && response.status < 600) {
                    throw new Error(`Server error: ${response.status}`);
                } else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            const result = await response.json();

            if (result.candidates && result.candidates.length > 0 &&
                result.candidates[0].content && result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0) {
                const text = result.candidates[0].content.parts[0].text;
                return { fact: text };
            } else {
                throw new Error("Unexpected API response structure from Gemini.");
            }
        } catch (err) {
            retries++;
            if (retries < maxRetries) {
                { 
                    const currentDelay = delay; 
                    await new Promise(res => setTimeout(res, currentDelay));
                }
                delay *= 2; 
            } else {
                throw err;
            }
        }

        }
            throw new Error("Failed to fetch fact after multiple retries.");

}