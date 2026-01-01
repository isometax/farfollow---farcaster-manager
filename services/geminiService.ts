
import { GoogleGenAI, Type } from "@google/genai";
import { FarcasterUser, AIInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const geminiService = {
  async analyzeUnfollowers(unfollowers: FarcasterUser[]): Promise<Record<string, AIInsight>> {
    if (unfollowers.length === 0) return {};

    const prompt = `Analyze these Farcaster users who follow me but I don't follow them back (or vice-versa).
    Focus on providing a recommendation ('keep', 'unfollow', 'maybe') based on their bio and potential influence.
    
    Users: ${JSON.stringify(unfollowers.map(u => ({ username: u.username, bio: u.bio, followers: u.followerCount })))}
    
    Return a JSON object where keys are usernames and values are objects with { analysis, recommendation, reason }.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              insights: {
                type: Type.OBJECT,
                additionalProperties: {
                  type: Type.OBJECT,
                  properties: {
                    analysis: { type: Type.STRING },
                    recommendation: { type: Type.STRING, enum: ['keep', 'unfollow', 'maybe'] },
                    reason: { type: Type.STRING }
                  },
                  required: ["analysis", "recommendation", "reason"]
                }
              }
            }
          }
        }
      });

      const data = JSON.parse(response.text);
      return data.insights || {};
    } catch (error) {
      console.error("Gemini Analysis Error:", error);
      return {};
    }
  }
};
