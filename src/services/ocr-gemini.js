// ─── OCR Service with Gemini Vision (Free, No Credit Card) ────────────────────
const { GoogleGenerativeAI } = require('@google/generative-ai');
const logger = require('../utils/logger');

let genAI = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not set');
    }
    genAI = new GoogleGenerativeAI(apiKey);
    logger.info('OCR', 'Gemini AI initialized');
  }
  return genAI;
}

async function processImage(imageBuffer) {
  try {
    logger.info('OCR', 'Starting Gemini Vision processing...');

    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    const prompt = `Analyze this game screenshot from Modern Warships. Extract the following information EXACTLY as shown in the image, preserving ALL special characters, Unicode characters, and symbols:

1. Player Name: (the name shown after the clan tag in brackets, preserve any special characters like Greek letters Ψ, Ω, Σ, etc.)
2. Player ID: (hexadecimal ID shown in the profile)
3. Player Level: (the number before "Level")
4. Current Rank: (e.g. Gold 1, Platinum 1, Diamond 2, Hero, Legendary)
5. Best Rank: (shown under Best rank e.g. Platinum 1, Hero)
6. Season Number: (number in e.g. SEASON 14)
7. Received Points: (number after Received Points or Clan Points)
8. Player Title: (e.g. Unsinkable, LIEUTENANT COMMANDER)

Important rules:
- Preserve ALL special characters EXACTLY as they appear
- If you see Greek letters (Ψ, Ω, Σ, etc.), keep them as-is
- Return ONLY the extracted data in this exact format:
NAME: [exact player name]
ID: [player id]
LEVEL: [level number]
CURRENT_RANK: [current rank or NOT_FOUND]
BEST_RANK: [best rank or NOT_FOUND]
SEASON: [season number or NOT_FOUND]
POINTS: [points number or NOT_FOUND]
TITLE: [title or NOT_FOUND]

If any field is not found, use "NOT_FOUND" for that field.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64Image
        }
      }
    ]);

    const response = result.response;
    const text = response.text();

    logger.info('OCR', 'Gemini response received', { text });

    const extractedData = parseGeminiResponse(text);

    return {
      success: true,
      rawText: text,
      data: extractedData
    };
  } catch (error) {
    logger.error('OCR', 'Gemini processing error', { error: error.message });
    return {
      success: false,
      rawText: '',
      data: null,
      error: error.message
    };
  }
}

function parseGeminiResponse(text) {
  let playerName = null;
  let playerId = null;
  let playerLevel = null;
  let currentRank = null;
  let bestRank = null;
  let seasonNumber = null;
  let rankPoints = null;
  let playerTitle = null;

  // Parse NAME
  const nameMatch = text.match(/NAME:\s*(.+)/i);
  if (nameMatch && nameMatch[1].trim() !== 'NOT_FOUND') {
    playerName = nameMatch[1].trim();
  }

  // Parse ID
  const idMatch = text.match(/ID:\s*([0-9A-Fa-f]+)/i);
  if (idMatch && idMatch[1].trim() !== 'NOT_FOUND') {
    playerId = idMatch[1].trim().toUpperCase();
  }

  // Parse LEVEL
  const levelMatch = text.match(/LEVEL:\s*(\d+)/i);
  if (levelMatch && levelMatch[1].trim() !== 'NOT_FOUND') {
    playerLevel = parseInt(levelMatch[1].trim());
  }

  // Parse CURRENT_RANK
  const currentRankMatch = text.match(/CURRENT_RANK:\s*(.+)/i);
  if (currentRankMatch && currentRankMatch[1].trim() !== 'NOT_FOUND') {
    currentRank = currentRankMatch[1].trim();
  }

  // Parse BEST_RANK
  const bestRankMatch = text.match(/BEST_RANK:\s*(.+)/i);
  if (bestRankMatch && bestRankMatch[1].trim() !== 'NOT_FOUND') {
    bestRank = bestRankMatch[1].trim();
  }

  // Parse SEASON
  const seasonMatch = text.match(/SEASON:\s*(\d+)/i);
  if (seasonMatch && seasonMatch[1].trim() !== 'NOT_FOUND') {
    seasonNumber = parseInt(seasonMatch[1].trim());
  }

  // Parse POINTS
  const pointsMatch = text.match(/POINTS:\s*(\d+)/i);
  if (pointsMatch && pointsMatch[1].trim() !== 'NOT_FOUND') {
    rankPoints = parseInt(pointsMatch[1].trim());
  }

  // Parse TITLE
  const titleMatch = text.match(/TITLE:\s*(.+)/i);
  if (titleMatch && titleMatch[1].trim() !== 'NOT_FOUND') {
    playerTitle = titleMatch[1].trim();
  }

  const result = {
    playerId,
    playerName,
    playerLevel,
    currentRank: currentRank || 'Unranked',
    bestRank: bestRank || currentRank || 'Unranked',
    seasonNumber: seasonNumber || null,
    rankPoints: rankPoints || 0,
    playerTitle: playerTitle || null,
    confidence: (playerId && currentRank) ? 'high' : playerId ? 'high' : 'low'
  };

  logger.info('OCR', 'Parsed Gemini result:', result);
  return result;
}

module.exports = { processImage };
