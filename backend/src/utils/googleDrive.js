const { google } = require('googleapis');
const { Readable } = require('stream');

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

// Service accounts have no storage quota on a personal Google Drive (only on
// Shared Drives, a Workspace-only feature) — so uploads authenticate as the
// actual Drive owner via OAuth2 instead. GOOGLE_OAUTH_REFRESH_TOKEN is
// generated once via scripts/getGoogleDriveToken.js (see docs/GOOGLE_DRIVE_SETUP.md).
function getAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Google Drive OAuth credentials are not configured (GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET / GOOGLE_OAUTH_REFRESH_TOKEN)');
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  return oauth2Client;
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

/**
 * Finds a folder by exact name under a given parent, creating it if it
 * doesn't exist yet.
 * @returns {Promise<string>} the folder's Drive file id
 */
async function getOrCreateFolder(drive, name, parentId) {
  const safeName = name.replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `name = '${safeName}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  if (existing.data.files?.length > 0) {
    return existing.data.files[0].id;
  }

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });
  return created.data.id;
}

/**
 * Finds the student's folder (named after their roll number), nested under
 * an academic-year folder under the configured root folder — creating
 * either level that doesn't exist yet.
 * @returns {Promise<string>} the roll-number folder's Drive file id
 */
async function getOrCreateStudentFolder(rollNumber, academicYear) {
  if (!ROOT_FOLDER_ID) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured');
  const drive = getDrive();

  const yearFolderId = await getOrCreateFolder(drive, academicYear || 'Unassigned', ROOT_FOLDER_ID);
  return getOrCreateFolder(drive, rollNumber, yearFolderId);
}

/**
 * Uploads a Buffer to the given Drive folder.
 * @returns {Promise<{id: string, name: string, mimeType: string, size: number}>}
 */
async function uploadFile({ buffer, fileName, mimeType, folderId }) {
  const drive = getDrive();
  const res = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id, name, mimeType, size',
  });
  return {
    id: res.data.id,
    name: res.data.name,
    mimeType: res.data.mimeType,
    size: Number(res.data.size || buffer.length),
  };
}

/**
 * Deletes a file from Drive by id. Silently ignores errors (e.g. already
 * deleted, or the caller wants a best-effort cleanup).
 */
async function deleteFile(fileId) {
  if (!fileId) return;
  try {
    const drive = getDrive();
    await drive.files.delete({ fileId });
  } catch {
    // non-fatal
  }
}

/**
 * Streams a file's content from Drive. Caller pipes res.data to the HTTP response.
 */
async function getFileStream(fileId) {
  const drive = getDrive();
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return res.data;
}

module.exports = { getOrCreateStudentFolder, uploadFile, deleteFile, getFileStream };
