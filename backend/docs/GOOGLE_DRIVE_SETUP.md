# Google Drive Setup — Student Documents

The student document upload feature (Photo, B-Form/CNIC, Father's CNIC, Matric
Result Card) stores files in Google Drive.

**Note:** a service-account approach was tried first but doesn't work for a
personal Gmail account — service accounts have no storage quota on a regular
"My Drive" (only on Shared Drives, which require Google Workspace). Since the
account here is a personal Gmail, the app instead authenticates as **you**
via OAuth2, using a refresh token generated once.

## 1. Create a Google Cloud project

Go to [console.cloud.google.com](https://console.cloud.google.com) and create
a new project (or use an existing one).

## 2. Enable the Google Drive API

**APIs & Services → Library** → search for **Google Drive API** → **Enable**.

## 3. Configure the OAuth consent screen

**APIs & Services → OAuth consent screen**:
- User type: **External**
- App name / support email: anything (e.g. "CMS Document Uploader")
- Scopes: none needed here (the script requests `drive.file` directly)
- Test users: add the Gmail account that owns the Drive documents will be
  stored in

Leave the app in **Testing** status — that's fine for this scope. (Testing
apps normally get a 7-day refresh token expiry, but that 7-day limit only
applies to *sensitive/restricted* scopes; `drive.file` is a non-sensitive
scope, so the token doesn't expire.)

## 4. Create an OAuth client ID

**APIs & Services → Credentials → Create Credentials → OAuth client ID**:
- Application type: **Desktop app**
- Name: anything

This gives you a **Client ID** and **Client Secret** — copy both.

## 5. Set the client credentials

In `backend/.env`:

```
GOOGLE_OAUTH_CLIENT_ID=<your client id>
GOOGLE_OAUTH_CLIENT_SECRET=<your client secret>
```

## 6. Run the one-time authorization script

```
cd backend
node scripts/getGoogleDriveToken.js
```

It prints a Google sign-in URL — open it in your browser, sign in with the
Gmail account that should own the documents, and grant access. The script
then:
- exchanges the authorization code for a refresh token
- creates a **"Student Documents"** folder in that Drive account (the app
  can only access folders it creates itself under this scope — a
  pre-existing folder ID won't work)
- prints both values to add to `.env`:

```
GOOGLE_OAUTH_REFRESH_TOKEN=<printed value>
GOOGLE_DRIVE_ROOT_FOLDER_ID=<printed value>
```

Paste those into `backend/.env`.

## 7. Restart the backend

```
cd backend
npm run dev
```

Uploading a document from the staff **Add/Edit Student → Documents** tab
will now create a per-student subfolder (named after their roll number)
inside "Student Documents" and store files there.

## Cleanup

An earlier attempt created a service account (`alahamd-cms-upload@...`) that
is no longer used — safe to delete it under **APIs & Services → Credentials**
in the Google Cloud Console if you want to tidy up.

## Reference — what was built

- **Schema**: `DocumentType` enum (`PHOTO`, `BFORM`, `CNIC_FRONT`,
  `CNIC_BACK`, `FATHER_CNIC_FRONT`, `FATHER_CNIC_BACK`, `MATRIC_RESULT`) and
  a `StudentDocument` model — one row per type per student
  (`@@unique([studentId, type])`, so re-uploading a type replaces it).
- **`backend/src/utils/googleDrive.js`** — OAuth2 auth (refresh token),
  `getOrCreateStudentFolder(rollNumber)`, `uploadFile`, `deleteFile`,
  `getFileStream`.
- **`backend/scripts/getGoogleDriveToken.js`** — one-time script to obtain
  the refresh token and create the root Drive folder (step 6 above).
- **`backend/src/controllers/studentDocumentController.js`** —
  list/upload/delete/stream-download.
- **Routes** (`backend/src/routes/students.js`):
  - `GET /students/:id/documents` — list (student can view their own, or
    `students.view` staff)
  - `POST /students/:id/documents` — upload, multipart field `document` +
    body field `type` (`students.edit` staff only)
  - `DELETE /students/:id/documents/:docId` (`students.edit` staff only)
  - `GET /students/:id/documents/:docId/file` — streams the file (student's
    own, or `students.view` staff)
- Accepts images and PDF, 10MB limit.
- **Frontend**: `staff/src/components/shared/StudentDocuments.jsx`, wired
  into the "Documents" tab on the staff Add/Edit Student page (only active
  once the student record exists — i.e. edit mode). Handles the B-Form vs
  CNIC choice and flags when a front/back pair (CNIC, Father's CNIC) is
  incomplete.
