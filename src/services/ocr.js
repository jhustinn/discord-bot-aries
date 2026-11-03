// ─── OCR Service ──────────────────────────────────────────────────────────────
const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');

async function processImage(imageBuffer) {
  try {
    logger.info('OCR', 'Starting OCR.space processing...');

    const base64Image = imageBuffer.toString('base64');

    const formData = new URLSearchParams();
    formData.append('base64Image', 'data:image/png;base64,' + base64Image);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2');
    formData.append('scale', 'true');
    formData.append('isTable', 'true');

    const response = await axios.post('https://api.ocr.space/parse/image', 
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apikey': config.OCR_API_KEY
        }
      }
    );

    if (response.data.IsErroredOnProcessing) {
      throw new Error(response.data.ErrorMessage || 'OCR processing failed');
    }

    const text = response.data.ParsedResults?.[0]?.ParsedText || '';
    logger.info('OCR', 'Text extracted successfully', { length: text.length, text: text.substring(0, 200) });

    const extractedData = parseText(text);

    return {
      success: true,
      rawText: text,
      data: extractedData
    };
  } catch (error) {
    logger.error('OCR', 'Processing error', { error: error.message });
    return {
      success: false,
      rawText: '',
      data: null,
      error: error.message
    };
  }
}

function parseText(text) {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  let playerId = null;
  let playerName = null;
  let playerLevel = null;

  logger.info('OCR', 'Parsing lines:', { count: lines.length });

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Player ID (hex format) - supports uppercase hex
    const hexIdMatch = line.match(/Player\s*ID\s*([0-9A-Fa-f]{8,16})/i);
    if (hexIdMatch) {
      playerId = hexIdMatch[1].toUpperCase();
      logger.info('OCR', 'Found Player ID:', { playerId });
    }

    // Player ID (decimal format)
    if (!playerId) {
      const decimalIdMatch = line.match(/(?:id|player\s*id)[:\s]*(\d{6,12})/i);
      if (decimalIdMatch) {
        playerId = decimalIdMatch[1];
        logger.info('OCR', 'Found Player ID (decimal):', { playerId });
      }
    }

    // Player Name - Multiple patterns for different formats
    
    // Pattern 1: [CLAN] PlayerName - most common
    const bracketNameMatch = line.match(/[\[\(]([^\]\)]*)[\]\)]\s*(.+)/);
    if (bracketNameMatch && !playerName) {
      const clanTag = bracketNameMatch[1].trim();
      let rawName = bracketNameMatch[2].trim();
      
      // Only take the FIRST word (before space or parenthesis)
      // This handles cases like "LEGACΨ (LEGACY)" -> "LEGACΨ"
      rawName = rawName.split(/\s+/)[0];
      rawName = rawName.split(/\(/)[0];
      rawName = rawName.split(/\[/)[0];
      
      // Remove trailing artifacts but preserve special characters
      rawName = rawName.replace(/[#]\d*$/g, '').trim();
      rawName = rawName.replace(/[\[\]\(\)]+$/g, '').trim();
      
      // Skip UI elements
      const skipWords = ['Back', 'Title', 'Level', 'Showcase', 'Academy', 'STATISTICS', 'ACHIEVEMENTS'];
      const skipPatterns = [/^Back$/i, /^Title$/i, /^Level$/i, /^\d+$/];
      
      const shouldSkip = skipWords.includes(rawName) || skipPatterns.some(p => p.test(rawName));
      
      if (rawName.length >= 2 && !shouldSkip) {
        playerName = rawName;
        logger.info('OCR', 'Found Player Name (bracket):', { playerName, clanTag, originalLine: line });
      }
    }

    // Pattern 2: Name after "Title" line (fallback)
    if (!playerName && i > 0) {
      const prevLine = lines[i - 1];
      if (prevLine.match(/Title/i) && !line.match(/^(Back|Level|Showcase|Academy|STATISTICS|ACHIEVEMENTS|CLAN)$/i)) {
        // Simple pattern: any word characters including Unicode
        const nameMatch = line.match(/^(\S+)$/);
        if (nameMatch && nameMatch[1].length >= 2) {
          playerName = nameMatch[1];
          logger.info('OCR', 'Found Player Name (after Title):', { playerName, line });
        }
      }
    }

    // Level patterns - more flexible
    const levelMatch1 = line.match(/(\d{1,3})\s*Level/i);
    const levelMatch2 = line.match(/Level\s*(\d{1,3})/i);
    const levelMatch3 = line.match(/LVL\s*(\d{1,3})/i);
    
    const levelResult = levelMatch1 || levelMatch2 || levelMatch3;
    if (levelResult && !playerLevel) {
      playerLevel = parseInt(levelResult[1]);
      logger.info('OCR', 'Found Level:', { playerLevel });
    }
  }

  // ─── Rank & Points Extraction ─────────────────────────────────────────────
  let currentRank = null;
  let bestRank = null;
  let seasonNumber = null;
  let rankPoints = null;
  let clanPoints = null;
  let playerTitle = null;

  // Single string search across full text for complex patterns
  const fullText = text.replace(/\s+/g, ' ');

  // 1. Season Number: e.g. (SEASON 14) or SEASON 14
  const seasonMatch = fullText.match(/(?:SEASON|Season)\s*(\d+)/i);
  if (seasonMatch) {
    seasonNumber = parseInt(seasonMatch[1]);
    logger.info('OCR', 'Found Season:', { seasonNumber });
  }

  // 2. Title: e.g. Title Unsinkable Achievements
  const titleMatch = fullText.match(/Title\s+([A-Za-z0-9\s]+?)\s+(?:Achievements|Player|Showcase)/i);
  if (titleMatch) {
    playerTitle = titleMatch[1].trim();
    logger.info('OCR', 'Found Title:', { playerTitle });
  }

  // 3. Received Points / Clan Points: e.g. Received Points 1839
  const receivedPointsMatch = fullText.match(/Received\s*Points\s*(\d+)/i);
  if (receivedPointsMatch) {
    rankPoints = parseInt(receivedPointsMatch[1]);
    logger.info('OCR', 'Found Received Points:', { rankPoints });
  }

  // 4. Clan Progress Points: e.g. ARIES 1266 / 1400
  const clanPointsMatch = fullText.match(/(\d{2,6})\s*\/\s*\d{2,6}/);
  if (clanPointsMatch) {
    clanPoints = parseInt(clanPointsMatch[1]);
    logger.info('OCR', 'Found Clan Progress Points:', { clanPoints });
  }

  // 5. Current Rank & Best Rank
  // Modern Warships competitive ranks: Bronze 1-3, Silver 1-3, Gold 1-3, Platinum 1-3, Diamond 1-3, Hero, Legendary
  const validRankRegex = /\b(Bronze|Silver|Gold|Platinum|Diamond|Hero|Legendary)\s*([1-3]|I|II|III)?\b/gi;

  // Method 1: Table-based column search (when Current rank and Best rank are in the header)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/Current\s*rank/i.test(line) && /Best\s*rank/i.test(line)) {
      const nextLine = lines[i + 1] || '';
      const matches = [...nextLine.matchAll(validRankRegex)].map(m => m[0].trim());
      if (matches.length >= 2) {
        currentRank = matches[0];
        bestRank = matches[1];
        logger.info('OCR', 'Found Ranks (table column layout):', { currentRank, bestRank });
        break;
      }
    }
  }

  // Method 2: Keyword-targeted search
  if (!currentRank || !bestRank) {
    // Look specifically for Best rank ... [Rank]
    const bestRankMatch = fullText.match(/Best\s*rank(?:\s*\([^)]*\))?[^A-Za-z0-9]*([A-Za-z]+\s*[1-3]?)/i);
    if (bestRankMatch) {
      const m = bestRankMatch[1].match(validRankRegex);
      if (m) {
        bestRank = m[0].trim();
        logger.info('OCR', 'Found Best Rank (keyword):', { bestRank });
      }
    }

    // Look specifically for Current rank ... [Rank]
    const currentRankMatch = fullText.match(/Current\s*rank[^A-Za-z0-9]*([A-Za-z]+\s*[1-3]?)/i);
    if (currentRankMatch) {
      const m = currentRankMatch[1].match(validRankRegex);
      if (m) {
        currentRank = m[0].trim();
        logger.info('OCR', 'Found Current Rank (keyword):', { currentRank });
      }
    }

    // Fallback: Dual matches strictly after "Current rank"
    if (!currentRank || !bestRank) {
      const afterCurrentRank = fullText.split(/Current\s*rank/i)[1] || '';
      const matches = [...afterCurrentRank.matchAll(validRankRegex)].map(m => m[0].trim());
      if (matches.length >= 2) {
        if (!currentRank) currentRank = matches[0];
        if (!bestRank) bestRank = matches[1];
      } else if (matches.length === 1 && !currentRank) {
        currentRank = matches[0];
      }
    }
  }

  // Fallback: Try to find name from lines that look like player names
  if (!playerName) {
    for (const line of lines) {
      // Skip lines that are clearly not player names
      if (line.length < 3 || line.length > 30) continue;
      if (/^\d+$/.test(line)) continue;
      if (/^(Back|Title|Level|Showcase|Academy|STATISTICS|ACHIEVEMENTS|CLAN|NAVAL|COMMANDER|LIEUTENANT|CHIEF|WARRANT|OFFICER|GOLD|PLATINUM|DIAMOND|Received|Points|Current|Best|rank|Season)$/i.test(line)) continue;
      if (/^(Player\s*ID|Achievements|Showcase)/i.test(line)) continue;
      if (/^\d+\/\d+$/.test(line)) continue;
      if (/^\d+\s*\/\s*\d+$/.test(line)) continue;
      
      // Check if line contains letters (including Unicode special chars)
      if (/[a-zA-Z\u00C0-\u024F\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u1F00-\u1FFF\u2000-\u206F\u2070-\u209F\u20A0-\u20CF\u2100-\u214F\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2460-\u24FF\u2500-\u257F\u2580-\u259F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF]/.test(line)) {
        playerName = line;
        logger.info('OCR', 'Found Player Name (fallback):', { playerName });
        break;
      }
    }
  }

  const result = {
    playerId,
    playerName,
    playerLevel,
    currentRank: currentRank || 'Unranked',
    bestRank: bestRank || currentRank || 'Unranked',
    seasonNumber: seasonNumber || null,
    rankPoints: rankPoints || clanPoints || 0,
    clanPoints: clanPoints || 0,
    playerTitle: playerTitle || null,
    confidence: (playerId && currentRank) ? 'high' : playerId ? 'medium' : 'low'
  };

  logger.info('OCR', 'Final parsed result:', result);
  return result;
}

module.exports = { processImage, parseText };

