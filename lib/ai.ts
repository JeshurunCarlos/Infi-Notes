
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Question } from '../components/QuizView';

export async function generateHighlightedSummary(text: string): Promise<string> {
  if (!text.trim()) {
    return "Please enter some text to summarize.";
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Please provide a comprehensive, structured summary of the following text.
- Use bullet points for readability.
- Use <bd>...</bd> tags to bold important phrases or concepts for emphasis.
- Identify and wrap specific entities with the following tags:
  - Key points: <kp>...</kp>
  - People: <ps>...</ps>
  - Dates: <dt>...</dt>
  - Locations: <lc>...</lc>

Example:
- The study conducted by <ps>Dr. No</ps> revealed <bd>significant anomalies</bd>.
- On <dt>May 4th</dt>, the team visited <lc>London</lc>.

Here is the text to summarize:
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
            model: 'gemini-2.5-flash',
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
            model: "gemini-2.5-flash",
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
            model: 'gemini-2.5-flash',
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
            model: 'gemini-2.5-flash',
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
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return response.text as string;
    } catch (error) {
        console.error("Journal Chat Error", error);
        return "I'm having a little trouble connecting to my thoughts right now. Please try again.";
    }
}

export async function performChat(message: string, history: { role: 'user' | 'model', text: string }[]): Promise<string> {
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
        4. If your answer depends on real-time information or search results, cite your sources at the end.
        
        Conversation History:
        ${historyText}
        User: ${message}
        AI:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        let text = response.text as string || "I couldn't generate a response.";
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        // Append sources to text if available
        if (sources.length > 0) {
            text += "\n\n**Sources:**\n";
            sources.forEach((chunk: any) => {
                if (chunk.web) {
                    text += `- [${chunk.web.title}](${chunk.web.uri})\n`;
                }
            });
        }

        return text;
    } catch (error) {
        console.error("Chat Error", error);
        return "I encountered an error processing your request. Please try again.";
    }
}

export interface NewsItem {
    title: string;
    summary: string;
    source: string;
    url: string;
}

export async function fetchNews(): Promise<NewsItem[]> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find the top 5 latest world news headlines right now. 
            Return ONLY a valid raw JSON array string (no markdown formatting, no code blocks) where each object has:
            - "title": The headline.
            - "summary": A concise summary (max 30 words).
            - "source": The name of the news source.
            - "url": A link to the story (if available from search results, otherwise leave empty).
            `,
            config: {
                tools: [{ googleSearch: {} }]
            }
        });

        let jsonString = response.text || "[]";
        
        // Robust JSON extraction: Find first [ and last ]
        const firstBracket = jsonString.indexOf('[');
        const lastBracket = jsonString.lastIndexOf(']');
        
        if (firstBracket !== -1 && lastBracket !== -1) {
            jsonString = jsonString.substring(firstBracket, lastBracket + 1);
        } else {
            console.warn("No JSON array found in news response");
            return [];
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
                responseModalities: [Modality.AUDIO], // Strictly use Modality enum
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio generated.");

        // Decode Base64 to ArrayBuffer
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
