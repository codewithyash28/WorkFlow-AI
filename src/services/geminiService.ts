/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export async function summarizeMeeting(text: string): Promise<string> {
  if (!ai) {
    return "Error: Gemini API key is not configured. Please set GEMINI_API_KEY.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are a professional meeting summarizer. Extract key decisions, action items, and deadlines from the following notes/transcript. Format the output with clear headings and bullet points. Assign responsibility if mentioned.

Text:
${text}`,
    });
    return response.text || "Failed to generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error: Could not process the request. Please check your API key.";
  }
}

export async function draftEmail(brief: string, tone: 'Formal' | 'Semi-formal' | 'Friendly'): Promise<string> {
  if (!ai) {
    return "Error: Gemini API key is not configured. Please set GEMINI_API_KEY.";
  }
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Draft a ${tone} email based on this brief: "${brief}". Keep it concise, clear, and impactful.`,
    });
    return response.text || "Failed to draft email.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error: Could not process the request. Please check your API key.";
  }
}
