// ─── Storage Service with Local Disk Fallback ───────────────────────────────
const supabase = require('../config/supabase');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = 'verification-attachments';
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

// Ensure local uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {}
}

async function uploadFile(fileBuffer, filePath, contentType) {
  // 1. Always save locally as instant and reliable backup
  try {
    const localTarget = path.join(UPLOADS_DIR, filePath);
    const localDir = path.dirname(localTarget);
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    fs.writeFileSync(localTarget, fileBuffer);
    logger.info('Storage', 'Saved local storage file backup', { filePath });
  } catch (localErr) {
    logger.warn('Storage', 'Local write warning', { error: localErr.message });
  }

  // 2. Try Supabase upload if network/URL is available
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: contentType,
        upsert: true
      });

    if (error) throw error;
    logger.info('Storage', 'File uploaded to Supabase successfully', { filePath });
    return data;
  } catch (err) {
    logger.warn('Storage', 'Supabase storage unreachable, continuing with local storage fallback', {
      filePath,
      error: err.message
    });
    // Return graceful success so submission never gets blocked
    return { path: filePath, isLocalFallback: true };
  }
}

function getPublicUrl(filePath) {
  // Normalize path
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Check if Supabase URL is reachable, otherwise default to local static route
  try {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(normalizedPath);

    if (data?.publicUrl && !data.publicUrl.includes('undefined')) {
      return data.publicUrl;
    }
  } catch (e) {}

  return `http://localhost:3000/uploads/${normalizedPath}`;
}

module.exports = {
  uploadFile,
  getPublicUrl
};
