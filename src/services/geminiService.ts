/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function summarizeMeeting(text: string): Promise<string> {
  if (!genAI) {
    return "Error: Gemini API key is not configured. Please set GEMINI_API_KEY.";
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(`You are a professional meeting summarizer. Extract key decisions, action items, and deadlines from the following notes/transcript. Format the output with clear headings and bullet points. Assign responsibility if mentioned.

Text:
${text}`);
    return response.response.text() || "Failed to generate summary.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error: Could not process the request. Please check your API key.";
  }
}

export async function draftEmail(brief: string, tone: 'Formal' | 'Semi-formal' | 'Friendly'): Promise<string> {
  if (!genAI) {
    return "Error: Gemini API key is not configured. Please set GEMINI_API_KEY.";
  }
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const response = await model.generateContent(`Draft a ${tone} email based on this brief: "${brief}". Keep it concise, clear, and impactful.`);
    return response.response.text() || "Failed to draft email.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error: Could not process the request. Please check your API key.";
  }
}
