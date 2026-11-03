// ─── Modern Warships Ship Database & Classification ───────────────────────────

const SHIP_CLASSES = {
  'frigates': { id: 'frigates', name: 'Frigates', icon: '🚢', channelName: 'frigates' },
  'destroyers': { id: 'destroyers', name: 'Destroyers', icon: '⚔️', channelName: 'destroyers' },
  'cruisers': { id: 'cruisers', name: 'Cruisers', icon: '🛡️', channelName: 'cruisers' },
  'battleships': { id: 'battleships', name: 'Battleships', icon: '💥', channelName: 'battleships' },
  'submarines': { id: 'submarines', name: 'Submarines', icon: '🦈', channelName: 'submarines' },
  'carriers': { id: 'carriers', name: 'Aircraft Carriers', icon: '✈️', channelName: 'carriers' },
  'assault-carriers': { id: 'assault-carriers', name: 'Assault Carriers', icon: '🦅', channelName: 'assault-carriers' },
  'ekranoplan': { id: 'ekranoplan', name: 'Ekranoplans', icon: '🚀', channelName: 'ekranoplan' },
  'hovercrafts': { id: 'hovercrafts', name: 'Hovercrafts', icon: '💨', channelName: 'hovercrafts' },
  'assault-landing-ships': { id: 'assault-landing-ships', name: 'Assault Landing Ships', icon: '🏝️', channelName: 'assault-landing-ships' },
};

const SHIPS = [
  // ─── FRIGATES ─────────────────────────────────────────────────────────────
  { name: 'IT FREMM-EVO', class: 'frigates', tier: 3, category: 'Market', aliases: ['FREMM-EVO', 'FREMM EVO', 'IT FREMM EVO'] },
  { name: 'BR Bahia (G40)', class: 'frigates', tier: 3, category: 'Shop', aliases: ['BR Bahia', 'Bahia', 'G40'] },
  { name: 'RF Admiral Gorshkov', class: 'frigates', tier: 3, category: 'Shop', aliases: ['Admiral Gorshkov', 'Gorshkov'] },
  { name: 'CNS Type 054B', class: 'frigates', tier: 3, category: 'Battle Pass', aliases: ['Type 054B', '054B'] },
  { name: 'USS Constitution II', class: 'frigates', tier: 3, category: 'Market', aliases: ['Constitution II', 'Constitution'] },
  { name: 'USS FF(X)', class: 'frigates', tier: 3, category: 'Shop', aliases: ['FF(X)', 'FFX', 'FFGX'] },
  { name: 'JS Mogami (FFM-1)', class: 'frigates', tier: 3, category: 'Shop', aliases: ['JS Mogami', 'Mogami', 'FFM-1'] },
  { name: 'FGS F126', class: 'frigates', tier: 3, category: 'Battle Pass', aliases: ['F126', 'FGS F-126'] },
  { name: 'FGS F127', class: 'frigates', tier: 3, category: 'Gacha', aliases: ['F127', 'FGS F-127'] },
  { name: 'ROKS FFX Batch III', class: 'frigates', tier: 3, category: 'Battle Pass', aliases: ['FFX Batch III', 'Chungnam'] },

  // ─── DESTROYERS ───────────────────────────────────────────────────────────
  { name: 'CN Type 055 Nanchang', class: 'destroyers', tier: 3, category: 'Shop', aliases: ['Type 055 Nanchang', 'Type 055', 'Nanchang', '055'] },
  { name: 'CN Type 055A', class: 'destroyers', tier: 3, category: 'Market', aliases: ['Type 055A', '055A'] },
  { name: 'CN Type 058', class: 'destroyers', tier: 3, category: 'Gacha', aliases: ['Type 058', '058'] },
  { name: 'USS Zumwalt (DDG-1000)', class: 'destroyers', tier: 3, category: 'Shop', aliases: ['USS Zumwalt', 'Zumwalt', 'DDG-1000'] },
  { name: 'USS Michael Monsoor (DDG-1001)', class: 'destroyers', tier: 3, category: 'Market', aliases: ['Michael Monsoor', 'Monsoor', 'DDG-1001'] },
  { name: 'USS Jack H. Lucas (DDG-125)', class: 'destroyers', tier: 3, category: 'Battle Pass', aliases: ['Jack H. Lucas', 'Jack Lucas', 'DDG-125'] },
  { name: 'RF Lider (Project 23560)', class: 'destroyers', tier: 3, category: 'Shop', aliases: ['RF Lider', 'Lider', 'Project 23560'] },
  { name: 'RF Admiral Ushakov', class: 'destroyers', tier: 3, category: 'Shop', aliases: ['Admiral Ushakov', 'Ushakov'] },
  { name: 'RF Admiral Basisty', class: 'destroyers', tier: 3, category: 'Battle Pass', aliases: ['Admiral Basisty', 'Basisty'] },
  { name: 'JS Maya (DDG-179)', class: 'destroyers', tier: 3, category: 'Shop', aliases: ['JS Maya', 'Maya', 'DDG-179'] },
  { name: 'ROKS Jeongjo the Great', class: 'destroyers', tier: 3, category: 'Battle Pass', aliases: ['Jeongjo the Great', 'Jeongjo', 'KDX-III'] },
  { name: 'FS Forbin', class: 'destroyers', tier: 3, category: 'Shop', aliases: ['Forbin', 'FS Forbin (D620)'] },
  { name: 'HMS Glasgow (Type 26)', class: 'destroyers', tier: 3, category: 'Battle Pass', aliases: ['HMS Glasgow', 'Glasgow', 'Type 26'] },

  // ─── CRUISERS ─────────────────────────────────────────────────────────────
  { name: 'RF TARK Pyotr Velikiy', class: 'cruisers', tier: 3, category: 'Shop', aliases: ['Pyotr Velikiy', 'Peter the Great', 'RF Pyotr Velikiy'] },
  { name: 'RF Varyag', class: 'cruisers', tier: 3, category: 'Shop', aliases: ['Varyag', 'RF Varyag'] },
  { name: 'RF Admiral Nakhimov', class: 'cruisers', tier: 3, category: 'Shop', aliases: ['Admiral Nakhimov', 'Nakhimov'] },
  { name: 'USS Port Royal (CG-73)', class: 'cruisers', tier: 3, category: 'Shop', aliases: ['USS Port Royal', 'Port Royal', 'CG-73'] },
  { name: 'USS CGX-21', class: 'cruisers', tier: 3, category: 'Market', aliases: ['CGX-21', 'CGX21'] },
  { name: 'USS Vella Gulf (CG-72)', class: 'cruisers', tier: 3, category: 'Shop', aliases: ['Vella Gulf', 'CG-72'] },
  { name: 'USS Long Beach (CGN-9)', class: 'cruisers', tier: 3, category: 'Battle Pass', aliases: ['Long Beach', 'CGN-9'] },
  { name: 'FS Blue Shark', class: 'cruisers', tier: 3, category: 'Market', aliases: ['Blue Shark', 'FS Blue Shark'] },
  { name: 'BPK Admiral Panteleyev', class: 'cruisers', tier: 3, category: 'Shop', aliases: ['Admiral Panteleyev', 'Panteleyev'] },

  // ─── BATTLESHIPS ──────────────────────────────────────────────────────────
  { name: 'USS Missouri (BB-63)', class: 'battleships', tier: 3, category: 'Shop', aliases: ['USS Missouri', 'Missouri', 'BB-63'] },
  { name: 'USS Massachusetts (BB-59)', class: 'battleships', tier: 3, category: 'Market', aliases: ['Massachusetts', 'BB-59'] },
  { name: 'USS New Hampshire (BB-1011)', class: 'battleships', tier: 3, category: 'Gacha', aliases: ['New Hampshire', 'BB-1011'] },
  { name: 'IJN Yamato', class: 'battleships', tier: 3, category: 'Shop', aliases: ['Yamato', 'IJN Yamato'] },
  { name: 'IJN Yamato Aegis', class: 'battleships', tier: 3, category: 'Market', aliases: ['Yamato Aegis', 'Aegis Yamato'] },
  { name: 'RF Moscow', class: 'battleships', tier: 3, category: 'Market', aliases: ['Moscow', 'RF Moscow'] },
  { name: 'Bismarck', class: 'battleships', tier: 3, category: 'Market', aliases: ['KMS Bismarck', 'Bismarck'] },
  { name: 'HMS Dreadnought', class: 'battleships', tier: 3, category: 'Market', aliases: ['Dreadnought', 'HMS Dreadnought'] },
  { name: 'HSwMS Gotland', class: 'battleships', tier: 3, category: 'Battle Pass', aliases: ['Gotland', 'HSwMS Gotland'] },

  // ─── SUBMARINES ───────────────────────────────────────────────────────────
  { name: 'SMX-31', class: 'submarines', tier: 3, category: 'Shop', aliases: ['SMX31', 'SMX 31'] },
  { name: 'RF Belgorod (K-329)', class: 'submarines', tier: 3, category: 'Market', aliases: ['Belgorod', 'K-329', 'RF Belgorod'] },
  { name: 'USS Ohio (SSGN-726)', class: 'submarines', tier: 3, category: 'Shop', aliases: ['USS Ohio', 'Ohio', 'SSGN-726'] },
  { name: 'USS Columbia (SSBN-826)', class: 'submarines', tier: 3, category: 'Market', aliases: ['Columbia', 'SSBN-826'] },
  { name: 'CN Type 096', class: 'submarines', tier: 3, category: 'Shop', aliases: ['Type 096', '096'] },
  { name: 'CN Type 092', class: 'submarines', tier: 3, category: 'Shop', aliases: ['Type 092', '092'] },
  { name: 'FS SMX-25', class: 'submarines', tier: 3, category: 'Shop', aliases: ['SMX-25', 'SMX25'] },
  { name: 'FS Swordship', class: 'submarines', tier: 3, category: 'Market', aliases: ['Swordship', 'FS Swordship'] },
  { name: 'JS Taigei (SS-513)', class: 'submarines', tier: 3, category: 'Battle Pass', aliases: ['Taigei', 'SS-513'] },
  { name: 'RF Yuriy Dolgorukiy', class: 'submarines', tier: 3, category: 'Shop', aliases: ['Yuriy Dolgorukiy', 'Dolgorukiy'] },

  // ─── AIRCRAFT CARRIERS (CV) ───────────────────────────────────────────────
  { name: 'USS Nimitz (CVN-68)', class: 'carriers', tier: 3, category: 'Shop', aliases: ['Nimitz', 'CVN-68', 'USS Nimitz'] },
  { name: 'RF Shtorm (Project 23000E)', class: 'carriers', tier: 3, category: 'Shop', aliases: ['RF Shtorm', 'Shtorm'] },
  { name: 'CN Type 003 Fujian', class: 'carriers', tier: 3, category: 'Shop', aliases: ['Type 003', 'Fujian', 'Type 003 Fujian', '003'] },
  { name: 'INS Vikrant', class: 'carriers', tier: 3, category: 'Shop', aliases: ['Vikrant', 'INS Vikrant'] },
  { name: 'JS Izumo (DDH-183)', class: 'carriers', tier: 3, category: 'Shop', aliases: ['JS Izumo', 'Izumo', 'DDH-183'] },
  { name: 'RO-PAX', class: 'carriers', tier: 3, category: 'Battle Pass', aliases: ['ROPAX', 'RO PAX'] },

  // ─── ASSAULT AIRCRAFT CARRIERS (ACV) ──────────────────────────────────────
  { name: 'USS Gerald R. Ford (CVN-78)', class: 'assault-carriers', tier: 3, category: 'Shop', aliases: ['Gerald R. Ford', 'Gerald Ford', 'CVN-78', 'Ford'] },
  { name: 'USS Enterprise (CVN-80)', class: 'assault-carriers', tier: 3, category: 'Market', aliases: ['Enterprise', 'CVN-80', 'USS Enterprise'] },
  { name: 'CN Type 004', class: 'assault-carriers', tier: 3, category: 'Market', aliases: ['Type 004', '004', 'CN Type 004'] },
  { name: 'FS Charles de Gaulle', class: 'assault-carriers', tier: 3, category: 'Battle Pass', aliases: ['Charles de Gaulle', 'De Gaulle', 'FS Charles de Gaulle (R91)'] },
  { name: 'Shtorm (Project 23000)', class: 'assault-carriers', tier: 3, category: 'Shop', aliases: ['Shtorm ACV'] },

  // ─── EKRANOPLANS ──────────────────────────────────────────────────────────
  { name: 'RF Burevestnik (Project 905)', class: 'ekranoplan', tier: 3, category: 'Market', aliases: ['RF Burevestnik', 'Burevestnik', 'Project 905'] },
  { name: 'Pan Spatial Argonas', class: 'ekranoplan', tier: 3, category: 'Market', aliases: ['Argonas', 'Pan Spatial Argonas'] },
  { name: 'RF Bartini A-2000-7', class: 'ekranoplan', tier: 3, category: 'Gacha', aliases: ['Bartini A-2000-7', 'Bartini', 'A-2000-7'] },
  { name: 'Lun-class MD-160', class: 'ekranoplan', tier: 2, category: 'Shop', aliases: ['Lun', 'Lun-class', 'MD-160'] },

  // ─── HOVERCRAFTS ──────────────────────────────────────────────────────────
  { name: 'LCAC (Landing Craft Air Cushion)', class: 'hovercrafts', tier: 2, category: 'Shop', aliases: ['LCAC'] },
  { name: 'Zubr-class', class: 'hovercrafts', tier: 2, category: 'Shop', aliases: ['Zubr', 'Zubr-class'] },
  { name: 'Mudskipper', class: 'hovercrafts', tier: 3, category: 'Battle Pass', aliases: ['Mudskipper'] },

  // ─── ASSAULT LANDING SHIPS ────────────────────────────────────────────────
  { name: 'CN Type 075', class: 'assault-landing-ships', tier: 3, category: 'Shop', aliases: ['Type 075', '075'] },
  { name: 'USS America (LHA-6)', class: 'assault-landing-ships', tier: 3, category: 'Shop', aliases: ['USS America', 'America', 'LHA-6'] },
  { name: 'Mistral-class', class: 'assault-landing-ships', tier: 3, category: 'Shop', aliases: ['Mistral', 'Mistral-class'] },
  { name: 'ROKS Dokdo (LPH-6111)', class: 'assault-landing-ships', tier: 3, category: 'Shop', aliases: ['Dokdo', 'ROKS Dokdo', 'LPH-6111'] },
  { name: 'JS Hyuga (DDH-181)', class: 'assault-landing-ships', tier: 3, category: 'Shop', aliases: ['JS Hyuga', 'Hyuga', 'DDH-181'] }
];

let activeShips = [...SHIPS];

/**
 * Searches the ship database for a match by exact name, alias, or fuzzy string.
 * @param {string} query
 * @returns {object|null}
 */
function findShip(query) {
  if (!query || typeof query !== 'string') return null;
  const cleanQuery = query.trim().toLowerCase();

  // 1. Exact match on name
  for (const ship of activeShips) {
    if (ship.name.toLowerCase() === cleanQuery) {
      return ship;
    }
  }

  // 2. Exact match on alias
  for (const ship of activeShips) {
    if (Array.isArray(ship.aliases)) {
      for (const alias of ship.aliases) {
        if (alias.toLowerCase() === cleanQuery) {
          return ship;
        }
      }
    }
  }

  // 3. Includes / Partial match
  for (const ship of activeShips) {
    if (cleanQuery.includes(ship.name.toLowerCase()) || ship.name.toLowerCase().includes(cleanQuery)) {
      return ship;
    }
    if (Array.isArray(ship.aliases)) {
      for (const alias of ship.aliases) {
        if (cleanQuery.includes(alias.toLowerCase()) || alias.toLowerCase().includes(cleanQuery)) {
          return ship;
        }
      }
    }
  }

  return null;
}

/**
 * Gets all ships belonging to a specific class.
 * @param {string} classId
 * @returns {Array}
 */
function getShipsByClass(classId) {
  const norm = classId.toLowerCase().trim();
  return activeShips.filter(s => s.class === norm);
}

/**
 * Gets all active ships.
 * @returns {Array}
 */
function getAllShips() {
  return activeShips;
}

/**
 * Syncs the in-memory ship list from the Laravel API backend.
 */
async function refreshShipsFromApi() {
  try {
    const axios = require('axios');
    const apiUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';
    const res = await axios.get(`${apiUrl}/ships`, { timeout: 4000 });
    if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
      activeShips = res.data.data.map(s => ({
        id: s.id,
        name: s.name,
        class: s.class,
        tier: s.tier,
        category: s.category,
        aliases: Array.isArray(s.aliases) ? s.aliases : (typeof s.aliases === 'string' ? JSON.parse(s.aliases || '[]') : []),
        country: s.country,
        image_url: s.image_url,
        is_active: s.is_active
      }));
      return { success: true, count: activeShips.length };
    }
  } catch (err) {
    // Fallback to static ships silently
  }
  return { success: false, count: activeShips.length };
}

// Initial sync attempt in background
setTimeout(() => {
  refreshShipsFromApi().catch(() => {});
}, 2000);

// Periodic sync every 15 minutes
setInterval(() => {
  refreshShipsFromApi().catch(() => {});
}, 15 * 60 * 1000);

module.exports = {
  SHIP_CLASSES,
  SHIPS,
  findShip,
  getShipsByClass,
  getAllShips,
  refreshShipsFromApi
};
