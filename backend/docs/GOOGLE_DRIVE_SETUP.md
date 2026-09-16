# Google Drive Setup — Student Documents

The student document upload feature (Photo, B-Form/CNIC, Father's CNIC, Matric
Result Card) stores files in Google Drive via a service account. This is not
configured yet — follow these steps when you're ready to enable it.

## 1. Create a Google Cloud project

Go to [console.cloud.google.com](https://console.cloud.google.com) and create
a new project (or use an existing one).

## 2. Enable the Google Drive API

**APIs & Services → Library** → search for **Google Drive API** → **Enable**.

## 3. Create a service account

**APIs & Services → Credentials → Create Credentials → Service Account**.
Give it any name, e.g. `cms-drive-uploader`. No special roles are needed at
the project level — access is granted via the shared Drive folder in step 5.

## 4. Create and download a JSON key

Open the service account you just created → **Keys** tab → **Add Key →
Create new key → JSON**. This downloads a `.json` file — keep it private,
never commit it to git.

## 5. Share a Drive folder with the service account

1. In your own Google Drive, create a folder (e.g. "Student Documents").
2. Share it with the service account's email — it looks like
   `cms-drive-uploader@your-project-id.iam.gserviceaccount.com` (find it
   inside the downloaded JSON key as `client_email`).
3. Give it **Editor** access.
4. Open the folder and copy its ID from the URL:
   `https://drive.google.com/drive/folders/<THIS_PART_IS_THE_FOLDER_ID>`

Every student gets their own subfolder (named after their roll number)
created automatically under this root folder on first upload.

## 6. Set environment variables

In `backend/.env`:

```
GOOGLE_SERVICE_ACCOUNT_KEY=<paste the entire downloaded JSON as one line>
GOOGLE_DRIVE_ROOT_FOLDER_ID=<the folder ID from step 5>
```

`GOOGLE_SERVICE_ACCOUNT_KEY` is the full `{...}` JSON object from the
downloaded key file, pasted as a single-line string value.

## 7. Restart the backend

```
cd backend
npm run dev
```

Uploading a document from the staff **Add/Edit Student → Documents** tab
will now create a per-student folder under your shared root folder and
store files there.

## Reference — what was built

- **Schema**: `DocumentType` enum (`PHOTO`, `BFORM`, `CNIC_FRONT`,
  `CNIC_BACK`, `FATHER_CNIC_FRONT`, `FATHER_CNIC_BACK`, `MATRIC_RESULT`) and
  a `StudentDocument` model — one row per type per student
  (`@@unique([studentId, type])`, so re-uploading a type replaces it).
- **`backend/src/utils/googleDrive.js`** — service-account auth,
  `getOrCreateStudentFolder(rollNumber)`, `uploadFile`, `deleteFile`,
  `getFileStream`.
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
