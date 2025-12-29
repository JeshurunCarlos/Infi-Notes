
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question } from '../components/QuizView';

export async function generateHighlightedSummary(text: string): Promise<string> {
  if (!text.trim()) {
    return "Please enter some text to summarize.";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Summarize the text below using bullet points for readability.
      
CRITICAL INSTRUCTION: You must use specific XML-like tags to highlight entities. Do NOT use markdown bolding (**text**).
Use the following tags:
- <bd>Text</bd> for BOLDING key phrases, important concepts, or emphasis.
- <kp>Text</kp> for Key Points or main ideas.
- <ps>Text</ps> for People or names.
- <dt>Text</dt> for Dates, times, or years.
- <lc>Text</lc> for Locations or places.

Example Format:
- The <kp>initiative</kp> was led by <ps>Dr. Smith</ps> in <lc>Paris</lc>.
- On <dt>Monday</dt>, results showed <bd>significant improvement</bd>.

Text to summarize:
---
${text}`,
      config: {
        temperature: 0.3,
      },
    });
    return response.text as string;
  } catch (error) {
    console.error("Error summarizing text:", error);
    if (error instanceof Error) {
        return `An error occurred: ${error.message}`;
    }
    return "An unknown error occurred while summarizing the text.";
  }
}


export async function generateQuizFromNotes(text: string): Promise<Question[]> {
    if (!text.trim()) {
        throw new Error("Cannot generate quiz from empty notes.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Based on the following notes, generate a quiz with 3 to 5 questions. Create a mix of multiple-choice and short-answer questions to test knowledge. For multiple-choice questions, provide 4 options. Ensure the correct answer is one of the options for MCQs.

Here are the notes:
---
${text}
---`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        questions: {
                            type: Type.ARRAY,
                            description: "An array of quiz questions.",
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    questionText: { type: Type.STRING, description: "The question." },
                                    type: { type: Type.STRING, enum: ['mcq', 'short_answer'], description: "The type of question." },
                                    options: {
                                        type: Type.ARRAY,
                                        description: 'An array of 4 strings for mcq options. Not included for short_answer.',
                                        items: { type: Type.STRING }
                                    },
                                    correctAnswer: {
                                        type: Type.STRING,
                                        description: 'The correct option value for mcq, or the exact answer for short_answer.'
                                    }
                                },
                                required: ['questionText', 'type', 'correctAnswer']
                            }
                        }
                    },
                    required: ['questions']
                },
            },
        });

        const jsonResponse = JSON.parse(response.text as string);
        return jsonResponse.questions || [];

    } catch (error) {
        console.error("Error generating quiz:", error);
        throw new Error("Failed to generate the quiz. The AI may be unable to create questions from your notes. Please try again with different content.");
    }
}

export async function performGoogleSearch(query: string): Promise<{ text: string; sources: any[] }> {
    if (!query.trim()) {
        throw new Error("Search query cannot be empty.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `You are a helpful and knowledgeable assistant. Answer the following query using Google Search.
            
Important Formatting Rules:
1. Use **bold** Markdown syntax for key concepts, names, and important entities.
2. Use bullet points or numbered lists where appropriate to structure the answer.
3. If you find relevant images in the search results, include them using Markdown syntax: ![alt text](url).
4. Keep paragraphs concise and readable.

Query: ${query}`,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        const text = response.text as string;
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        return { text, sources };

    } catch (error) {
        console.error("Error performing Google Search:", error);
        if (error instanceof Error) {
            throw new Error(`Google Search failed: ${error.message}`);
        }
        throw new Error("An unknown error occurred during Google Search.");
    }
}

export async function getMusicSuggestions(mood: string): Promise<string[]> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Suggest 4 distinct songs, albums, or playlists on Spotify for a "${mood}" mood. Return ONLY a JSON array of strings, where each string is a search query I can use to find it on Spotify (e.g. "Song Name Artist" or "Album Name Artist").`,
             config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            },
        });
        return JSON.parse(response.text as string);
    } catch (error) {
        console.error("Error getting suggestions:", error);
        return [];
    }
}

export interface DictionaryResult {
    word: string;
    phonetic?: string;
    meanings: {
        partOfSpeech: string;
        definitions: {
            definition: string;
            example?: string;
        }[];
    }[];
    synonyms: string[];
    antonyms: string[];
}

export async function lookupDictionary(word: string): Promise<DictionaryResult> {
    if (!word.trim()) {
        throw new Error("Word cannot be empty.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Define the word '${word}'. Return a JSON object with the following structure:
            - word: string
            - phonetic: string (IPA notation)
            - meanings: array of objects, each containing:
                - partOfSpeech: string (e.g., noun, verb)
                - definitions: array of objects, each containing:
                    - definition: string
                    - example: string (optional)
            - synonyms: array of strings (up to 5)
            - antonyms: array of strings (up to 5)
            `,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING },
                        phonetic: { type: Type.STRING },
                        meanings: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    partOfSpeech: { type: Type.STRING },
                                    definitions: {
                                        type: Type.ARRAY,
                                        items: {
                                            type: Type.OBJECT,
                                            properties: {
                                                definition: { type: Type.STRING },
                                                example: { type: Type.STRING }
                                            },
                                            required: ['definition']
                                        }
                                    }
                                },
                                required: ['partOfSpeech', 'definitions']
                            }
                        },
                        synonyms: { type: Type.ARRAY, items: { type: Type.STRING } },
                        antonyms: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['word', 'meanings']
                }
            },
        });

        return JSON.parse(response.text as string);
    } catch (error) {
        console.error("Error looking up dictionary:", error);
        throw new Error("Failed to fetch definition.");
    }
}

export async function chatWithJournal(journalContent: string, userMessage: string, history: { role: 'user' | 'model', text: string }[]): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const systemInstruction = `You are a thoughtful, empathetic journaling companion. 
        Your goal is to help the user reflect on their thoughts, explore their feelings, and gain clarity. 
        
        Context - The user is currently writing this journal entry:
        "${journalContent}"
        
        Respond to the user's latest message in a supportive, non-judgmental way. Ask open-ended questions if appropriate to deepen their reflection. Keep responses concise and conversational.`;

        let historyText = "";
        history.forEach(msg => {
            historyText += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
        });

        const prompt = `${systemInstruction}\n\nConversation History:\n${historyText}\nUser: ${userMessage}\nAI:`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        return response.text as string;
    } catch (error) {
        console.error("Journal Chat Error", error);
        return "I'm having a little trouble connecting to my thoughts right now. Please try again.";
    }
}

export interface ChatResponse {
    text: string;
    sources: { title: string; uri: string }[];
    followUps: string[];
}

export async function performChat(message: string, history: { role: 'user' | 'model', text: string }[]): Promise<ChatResponse> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        let historyText = "";
        history.forEach(msg => {
            historyText += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}\n`;
        });

        const prompt = `You are a helpful AI assistant connected to the internet. 
        Answer the user's question clearly and concisely.
        
        Important Formatting Rules:
        1. Use **bold** for emphasis on key terms.
        2. Use bullet points or lists for structured data.
        3. Use code blocks for code snippets.
        
        At the very end of your response, strictly output a separator "|||" followed by a JSON list of 3 short follow-up questions the user might want to ask next.
        Example format:
        [Answer Text...]
        |||
        ["Question 1?", "Question 2?", "Question 3?"]
        
        Conversation History:
        ${historyText}
        User: ${message}
        AI:`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        let rawText = response.text as string || "I couldn't generate a response.";
        let text = rawText;
        let followUps: string[] = [];

        // Parse Follow-ups
        const splitParts = rawText.split('|||');
        if (splitParts.length > 1) {
            text = splitParts[0].trim();
            try {
                const followUpsJson = splitParts[1].trim();
                const parsed = JSON.parse(followUpsJson);
                if (Array.isArray(parsed)) {
                    followUps = parsed;
                }
            } catch (e) {
                console.warn("Failed to parse follow-up questions JSON", e);
            }
        }

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources: { title: string; uri: string }[] = [];

        groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
                sources.push({ title: chunk.web.title, uri: chunk.web.uri });
            }
        });

        return { text, sources, followUps };
    } catch (error) {
        console.error("Chat Error", error);
        return { 
            text: "I encountered an error processing your request. Please try again.", 
            sources: [], 
            followUps: [] 
        };
    }
}

export interface NewsItem {
    title: string;
    summary: string;
    source: string;
    url: string;
    imageUrl?: string;
}

export interface WeatherData {
    location: string;
    temperature: number;
    condition: string;
    icon: string;
    wind: string;
    humidity: string;
}

export async function fetchWeather(location: string): Promise<WeatherData> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Get the current weather for ${location}. Return a JSON object with location, temperature (in Celsius), condition (e.g., "Sunny"), a single emoji icon for the condition, wind (e.g., "10 km/h"), and humidity (e.g., "60%").`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        location: { type: Type.STRING },
                        temperature: { type: Type.NUMBER },
                        condition: { type: Type.STRING },
                        icon: { type: Type.STRING },
                        wind: { type: Type.STRING },
                        humidity: { type: Type.STRING },
                    },
                    required: ['location', 'temperature', 'condition', 'icon', 'wind', 'humidity']
                }
            }
        });

        return JSON.parse(response.text as string);
    } catch (error) {
        console.error("Error fetching weather:", error);
        throw new Error("Could not fetch weather data.");
    }
}

export async function fetchNews(): Promise<NewsItem[]> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Find the top 5 latest world news headlines right now. 
            Return ONLY a valid raw JSON array string (no markdown formatting, no code blocks) where each object has:
            - "title": The headline.
            - "summary": A concise summary (max 30 words).
            - "source": The name of the news source.
            - "url": A link to the story (if available from search results, otherwise leave empty).
            - "imageUrl": A URL to a relevant image for the news story if found, otherwise null.
            `,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        let jsonString = response.text || "[]";
        
        // Safer JSON extraction using robust pattern finding
        const match = jsonString.match(/\[\s*\{.*\}\s*\]/s);
        if (match) {
            jsonString = match[0];
        } else {
            console.warn("Regex fallback for JSON array extraction");
            const firstBracket = jsonString.indexOf('[');
            const lastBracket = jsonString.lastIndexOf(']');
            if (firstBracket !== -1 && lastBracket !== -1) {
                jsonString = jsonString.substring(firstBracket, lastBracket + 1);
            } else return [];
        }
        
        const newsItems = JSON.parse(jsonString);
        return Array.isArray(newsItems) ? newsItems : [];
    } catch (error) {
        console.error("Error fetching news:", error);
        return [];
    }
}

export async function generateSpeechFromText(text: string): Promise<ArrayBuffer> {
    if (!text.trim()) throw new Error("No text to read.");
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO], 
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated.");

        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    } catch (error) {
        console.error("TTS Error:", error);
        throw error;
    }
}
