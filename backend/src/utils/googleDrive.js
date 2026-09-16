const { google } = require('googleapis');
const { Readable } = require('stream');

const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

// GOOGLE_SERVICE_ACCOUNT_KEY holds the full service-account JSON key as a
// single-line string env var (paste the downloaded key's contents as-is).
function getAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not configured');
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
}

function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() });
}

/**
 * Finds the student's folder (named after their roll number) under the
 * configured root folder, creating it if it doesn't exist yet.
 * @returns {Promise<string>} the folder's Drive file id
 */
async function getOrCreateStudentFolder(rollNumber) {
  if (!ROOT_FOLDER_ID) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID is not configured');
  const drive = getDrive();

  const safeName = rollNumber.replace(/'/g, "\\'");
  const existing = await drive.files.list({
    q: `name = '${safeName}' and '${ROOT_FOLDER_ID}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });
  if (existing.data.files?.length > 0) {
    return existing.data.files[0].id;
  }

  const created = await drive.files.create({
    requestBody: {
      name: rollNumber,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [ROOT_FOLDER_ID],
    },
    fields: 'id',
  });
  return created.data.id;
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
