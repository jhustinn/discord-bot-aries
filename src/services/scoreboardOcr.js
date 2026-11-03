// ─── Scoreboard OCR Parser for Modern Warships Battle Records ─────────────────
const { findShip, SHIP_CLASSES } = require('../config/ships');
const logger = require('../utils/logger');

/**
 * Parses raw text extracted from a Modern Warships battle result / scoreboard screenshot.
 * @param {string} rawText
 * @param {object} [context] - Optional hints e.g. { discordUsername, inputShip, inputDamage }
 * @returns {object}
 */
function parseScoreboardText(rawText, context = {}) {
  if (!rawText) rawText = '';
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const fullText = rawText.replace(/\s+/g, ' ');

  logger.info('ScoreboardOCR', 'Parsing battle scoreboard text...', { length: rawText.length, linesCount: lines.length });

  let detectedDamage = null;
  let detectedShip = null;
  let detectedShipClass = null;
  let detectedPlayerName = null;
  let detectedPlayerId = null;
  let detectedKills = 0;
  let detectedAssists = 0;
  let detectedMap = null;

  // 1. Manual / Context Overrides if provided
  if (context.inputDamage && !isNaN(Number(context.inputDamage))) {
    detectedDamage = Number(context.inputDamage);
  }

  if (context.inputShip) {
    const matched = findShip(context.inputShip);
    if (matched) {
      detectedShip = matched.name;
      detectedShipClass = matched.class;
    } else {
      detectedShip = context.inputShip;
      detectedShipClass = 'frigates'; // default
    }
  }

  // 2. Parse Damage Number (typically 6-8 digits, formatted like 1,633,758 or 2,924,300 or 3.031.173)
  if (!detectedDamage) {
    // Look for damage patterns with commas or dots (100k - 10M range)
    const damageMatches = [...rawText.matchAll(/\b([1-9]\d{0,2}(?:[.,]\d{3}){1,2})\b/g)];
    
    // Sort matches by numeric value descending (highest number is typically the player's damage)
    const validDamages = [];
    for (const match of damageMatches) {
      const numStr = match[1].replace(/[.,]/g, '');
      const val = parseInt(numStr, 10);
      // Valid battle damage range in MW: 200,000 to 15,000,000
      if (val >= 200000 && val <= 15000000) {
        validDamages.push(val);
      }
    }

    if (validDamages.length > 0) {
      // Pick the highest damage or the first prominent damage
      detectedDamage = validDamages[0];
      logger.info('ScoreboardOCR', 'Detected Damage:', { detectedDamage, count: validDamages.length });
    } else {
      // Fallback: search for plain 6-7 digit integers (e.g. 1633758)
      const plainMatches = [...rawText.matchAll(/\b([1-9]\d{5,7})\b/g)];
      for (const m of plainMatches) {
        const val = parseInt(m[1], 10);
        if (val >= 200000 && val <= 15000000) {
          detectedDamage = val;
          break;
        }
      }
    }
  }

  // 3. Detect Ship Name & Class from Ship Database
  if (!detectedShip) {
    // Check against all known ships
    const matched = findShip(rawText);
    if (matched) {
      detectedShip = matched.name;
      detectedShipClass = matched.class;
      logger.info('ScoreboardOCR', 'Detected Ship from DB:', { ship: detectedShip, class: detectedShipClass });
    }
  }

  // If ship class was not resolved, try to guess from class mentions (e.g. @Frigate-Record-Keeper)
  if (!detectedShipClass) {
    for (const [classKey, classInfo] of Object.entries(SHIP_CLASSES)) {
      if (new RegExp(classKey, 'i').test(rawText) || new RegExp(classInfo.name, 'i').test(rawText)) {
        detectedShipClass = classKey;
        break;
      }
    }
  }

  // 4. Detect Player ID (16-character hexadecimal ID)
  const hexMatch = rawText.match(/\b([0-9A-Fa-f]{16})\b/);
  if (hexMatch) {
    detectedPlayerId = hexMatch[1].toUpperCase();
    logger.info('ScoreboardOCR', 'Detected Player Hex ID:', { detectedPlayerId });
  }

  // 5. Detect Player Name (clan tag bracket or username)
  const clanNameMatch = rawText.match(/[\[\(]([^\]\)]*)[\]\)]\s*([A-Za-z0-9_.\- ]+)/);
  if (clanNameMatch) {
    detectedPlayerName = clanNameMatch[2].trim().split(/\s+/)[0];
  } else if (context.discordUsername) {
    detectedPlayerName = context.discordUsername;
  }

  // 6. Detect Kills and Assists
  const killsMatch = rawText.match(/(?:Destructions|Kills)[:\s]*(\d+)/i);
  if (killsMatch) {
    detectedKills = parseInt(killsMatch[1], 10);
  }

  const assistsMatch = rawText.match(/Assists[:\s]*(\d+)/i);
  if (assistsMatch) {
    detectedAssists = parseInt(assistsMatch[1], 10);
  }

  // 7. Detect Map Name
  const knownMaps = ['Lost City', 'Arctic', 'Storm', 'Islands of Stone', 'Greenland', 'Uncompleted Base', 'Two Islands', 'Way of the Dragon', 'Sunken City', 'Sunset'];
  for (const m of knownMaps) {
    if (new RegExp(m, 'i').test(rawText)) {
      detectedMap = m;
      break;
    }
  }

  return {
    damage: detectedDamage || 0,
    shipName: detectedShip || 'Custom Ship',
    shipClass: detectedShipClass || 'frigates',
    playerName: detectedPlayerName || context.discordUsername || 'Unknown Sailor',
    playerId: detectedPlayerId || null,
    kills: detectedKills,
    assists: detectedAssists,
    mapName: detectedMap || 'Unknown Map',
    confidence: (detectedDamage > 0 && detectedShip) ? 'high' : detectedDamage > 0 ? 'medium' : 'low'
  };
}

module.exports = {
  parseScoreboardText
};
