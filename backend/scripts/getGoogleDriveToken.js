// One-time helper to obtain a Google Drive OAuth refresh token for a personal
// Gmail account. Run with:
//   node scripts/getGoogleDriveToken.js
// after setting GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env.
// See docs/GOOGLE_DRIVE_SETUP.md for the full walkthrough.

require('dotenv').config();
const http = require('http');
const { google } = require('googleapis');

const PORT = 53682;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in backend/.env first.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces Google to always return a refresh_token
  scope: ['https://www.googleapis.com/auth/drive.file'],
});

const server = http.createServer(async (req, res) => {
  if (!req.url.startsWith('/oauth2callback')) {
    res.writeHead(404);
    res.end();
    return;
  }

  const url = new URL(req.url, REDIRECT_URI);
  const code = url.searchParams.get('code');

  if (!code) {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Missing authorization code.');
    return;
  }

  let exitCode = 0;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Success — you can close this tab and go back to the terminal.');

    console.log('\n✓ Authorization complete.\n');
    if (!tokens.refresh_token) {
      console.log('No refresh_token was returned — you likely authorized this app before.');
      console.log('Revoke its access at https://myaccount.google.com/permissions and run this script again.\n');
      exitCode = 1;
    } else {
      // The drive.file scope only grants access to files/folders this app
      // creates itself, so the root folder must be created here (right after
      // consent) rather than reused from one the user made by hand.
      oauth2Client.setCredentials(tokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });
      const folder = await drive.files.create({
        requestBody: { name: 'Student Documents', mimeType: 'application/vnd.google-apps.folder' },
        fields: 'id',
      });

      console.log('Add these to backend/.env:\n');
      console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log(`GOOGLE_DRIVE_ROOT_FOLDER_ID=${folder.data.id}\n`);
      console.log('A "Student Documents" folder was created in your Google Drive — that\'s the new root folder ID above (any previous manually-created folder ID will not work with this scope).\n');
    }
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Failed to exchange the authorization code — check the terminal.');
    console.error('Token exchange failed:', err.message);
    exitCode = 1;
  } finally {
    server.close(() => process.exit(exitCode));
  }
});

server.listen(PORT, () => {
  console.log('Open this URL in your browser and sign in with the Google account that owns the Drive folder:\n');
  console.log(authUrl);
  console.log(`\nWaiting for the redirect to ${REDIRECT_URI} ...`);
});
