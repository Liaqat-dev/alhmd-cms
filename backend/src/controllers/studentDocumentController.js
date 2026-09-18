const prisma = require('../lib/prisma');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { getOrCreateStudentFolder, uploadFile, deleteFile, getFileStream } = require('../utils/googleDrive');

const DOCUMENT_TYPES = [
  'PHOTO', 'BFORM', 'CNIC_FRONT', 'CNIC_BACK',
  'FATHER_CNIC_FRONT', 'FATHER_CNIC_BACK', 'MATRIC_RESULT',
];

const documentSelect = {
  id: true, type: true, fileName: true, mimeType: true, fileSize: true, createdAt: true, updatedAt: true,
};

// GET /students/:id/documents
const listStudentDocuments = catchAsync(async (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const documents = await prisma.studentDocument.findMany({
    where: { studentId },
    select: documentSelect,
    orderBy: { type: 'asc' },
  });
  res.json({ documents });
});

// POST /students/:id/documents  (multipart: file field "document", body.type)
const uploadStudentDocument = catchAsync(async (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const { type } = req.body;

  if (!DOCUMENT_TYPES.includes(type)) {
    throw new AppError(400, { message: 'Invalid document type' });
  }
  if (!req.file) {
    throw new AppError(400, { message: 'A file is required' });
  }

  const student = await prisma.student.findUnique({ where: { id: studentId }, select: { id: true, rollNumber: true, academicYear: true } });
  if (!student) throw new AppError(404, 'Student not found');

  const existing = await prisma.studentDocument.findUnique({
    where: { studentId_type: { studentId, type } },
  });

  const folderId = await getOrCreateStudentFolder(student.rollNumber, student.academicYear);
  const ext = (req.file.originalname.match(/\.[^.]+$/) || [''])[0];
  const fileName = `${type}_${student.rollNumber}${ext}`;

  const uploaded = await uploadFile({
    buffer: req.file.buffer,
    fileName,
    mimeType: req.file.mimetype,
    folderId,
  });

  const document = await prisma.studentDocument.upsert({
    where: { studentId_type: { studentId, type } },
    update: {
      driveFileId: uploaded.id,
      driveFolderId: folderId,
      fileName: uploaded.name,
      mimeType: uploaded.mimeType,
      fileSize: uploaded.size,
      uploadedBy: req.user.id,
    },
    create: {
      studentId, type,
      driveFileId: uploaded.id,
      driveFolderId: folderId,
      fileName: uploaded.name,
      mimeType: uploaded.mimeType,
      fileSize: uploaded.size,
      uploadedBy: req.user.id,
    },
    select: documentSelect,
  });

  // Replacing an existing document — delete the old Drive file only after
  // the new one is safely stored, so a failed upload never loses the old copy.
  if (existing) await deleteFile(existing.driveFileId);

  res.status(201).json({ message: 'Document uploaded successfully', document });
});

// DELETE /students/:id/documents/:docId
const deleteStudentDocument = catchAsync(async (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const docId = parseInt(req.params.docId, 10);

  const document = await prisma.studentDocument.findFirst({ where: { id: docId, studentId } });
  if (!document) throw new AppError(404, 'Document not found');

  await deleteFile(document.driveFileId);
  await prisma.studentDocument.delete({ where: { id: docId } });

  res.json({ message: 'Document deleted successfully' });
});

// GET /students/:id/documents/:docId/file
const downloadStudentDocument = catchAsync(async (req, res) => {
  const studentId = parseInt(req.params.id, 10);
  const docId = parseInt(req.params.docId, 10);

  const document = await prisma.studentDocument.findFirst({ where: { id: docId, studentId } });
  if (!document) throw new AppError(404, 'Document not found');

  const stream = await getFileStream(document.driveFileId);
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
  stream.on('error', () => res.status(502).end());
  stream.pipe(res);
});

module.exports = {
  listStudentDocuments, uploadStudentDocument, deleteStudentDocument, downloadStudentDocument,
};
