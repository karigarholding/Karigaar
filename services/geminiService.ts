
import { GoogleGenAI, Type } from "@google/genai";
import { RingAnalysisResult } from "../types";
import { DiamondShape, getClosestDiamondDimension } from "../diamondConstants";

const SYSTEM_INSTRUCTION = `
You are a Master Goldsmith and Jewelry Appraiser. Your expertise lies in "Visual Metrology"—estimating exact physical dimensions of jewelry from photographic evidence.

CORE PROTOCOLS:
1. ANCHORING: Use standard jewelry proportions as your internal ruler.
2. AGGRESSIVE PRECISION: Avoid wide ranges. Provide tight millimeter estimates.
3. PROFILE RECOGNITION: Identify the cross-section (Flat, Domed, Knife-edge, Comfort-fit).

DIAMOND PROTOCOL:
You will be provided with a carat weight and a desired shape (Round, Oval, etc.).
Your goal is to cross-reference the visual evidence in the photo with standard dimensions for that shape and weight.
Standard proportions: 1.0ct Round is ~6.5mm. 1.0ct Emerald is ~7x5mm.
`;

const PROMPT = `
ACT AS A TECHNICAL APPRAISER. Analyze the provided image and estimate dimensions.
Be precise. Return only the JSON object.

RETURN THIS JSON FORMAT:
{
  "style": "Brief style description",
  "estimatedWidthMinMm": float,
  "estimatedWidthMaxMm": float,
  "estimatedThicknessMm": float,
  "confidence": "High" | "Medium" | "Low"
}
`;

const DIAMOND_PROMPT = (carats: number, shape: DiamondShape) => `
Estimate the face-up dimensions in millimeters for a ${shape} cut diamond weighing ${carats} carats.
Analyze the photo to see if the stone appears slightly deeper or shallower than average and adjust the dimensions.
Return ONLY a JSON object with the property "dimensions" (string). 
If round-like (Round, Asscher, Heart, Cushion), provide a single diameter number as a string (e.g., "6.5").
If fancy-cut (Oval, Pear, Emerald, Marquise, Radiant), provide "WxH" format (e.g., "7x5").
`;

const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const fetchSingleSample = async (imageBase64: string, mimeType: string): Promise<RingAnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType, data: imageBase64 } },
        { text: PROMPT }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          estimatedWidthMinMm: { type: Type.NUMBER },
          estimatedWidthMaxMm: { type: Type.NUMBER },
          estimatedThicknessMm: { type: Type.NUMBER },
          style: { type: Type.STRING },
          confidence: { type: Type.STRING, enum: ["High", "Medium", "Low"] }
        },
        required: ["estimatedWidthMinMm", "estimatedWidthMaxMm", "estimatedThicknessMm", "style", "confidence"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty response");
  const data = JSON.parse(text);
  return {
    ...data,
    description: data.style
  };
};

export const analyzeRingImage = async (imageFile: File): Promise<RingAnalysisResult> => {
  try {
    const imageBase64 = await fileToGenerativePart(imageFile);
    const samplePromises = [
      fetchSingleSample(imageBase64, imageFile.type),
      fetchSingleSample(imageBase64, imageFile.type),
      fetchSingleSample(imageBase64, imageFile.type)
    ];

    const results = (await Promise.allSettled(samplePromises))
      .filter((p): p is PromiseFulfilledResult<RingAnalysisResult> => p.status === 'fulfilled')
      .map(p => p.value);

    if (results.length === 0) throw new Error("All independent samples failed.");

    const sum = results.reduce((acc, curr) => ({
      min: acc.min + curr.estimatedWidthMinMm,
      max: acc.max + curr.estimatedWidthMaxMm,
      thick: acc.thick + curr.estimatedThicknessMm
    }), { min: 0, max: 0, thick: 0 });

    const count = results.length;

    return {
      estimatedWidthMinMm: parseFloat((sum.min / count).toFixed(2)),
      estimatedWidthMaxMm: parseFloat((sum.max / count).toFixed(2)),
      estimatedThicknessMm: parseFloat((sum.thick / count).toFixed(2)),
      description: results[0].description, 
      confidence: results.some(r => r.confidence === 'Low') ? 'Low' : results[0].confidence
    };
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      estimatedWidthMinMm: 2.5,
      estimatedWidthMaxMm: 3.5,
      estimatedThicknessMm: 1.5,
      description: "Analysis error. Using fallback estimates.",
      confidence: "Low"
    };
  }
};

export const estimateDiamondDimensions = async (carats: number, shape: DiamondShape, imageFile?: File | null): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const parts: any[] = [{ text: DIAMOND_PROMPT(carats, shape) }];
    
    if (imageFile) {
      const imageBase64 = await fileToGenerativePart(imageFile);
      parts.push({ inlineData: { mimeType: imageFile.type, data: imageBase64 } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            dimensions: { type: Type.STRING }
          },
          required: ["dimensions"]
        }
      }
    });

    const text = response.text;
    if (!text) return getClosestDiamondDimension(shape, carats);
    const data = JSON.parse(text);
    return data.dimensions;
  } catch (error) {
    console.error("Diamond estimation error:", error);
    return getClosestDiamondDimension(shape, carats);
  }
};
