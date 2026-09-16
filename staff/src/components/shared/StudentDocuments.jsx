import {useEffect, useRef, useState} from 'react'
import {studentsAPI} from '@/services/api'
import {useToast} from '@/hooks/use-toast'
import {
    CheckCircle2, Eye, FileText, IdCard, Image as ImageIcon,
    Loader2, Trash2, Upload, UserSquare2,
} from 'lucide-react'

const MAX_FILE_MB = 10

const TYPE_LABELS = {
    PHOTO: 'Photo',
    BFORM: 'B-Form',
    CNIC_FRONT: 'CNIC (Front)',
    CNIC_BACK: 'CNIC (Back)',
    FATHER_CNIC_FRONT: "Father's CNIC (Front)",
    FATHER_CNIC_BACK: "Father's CNIC (Back)",
    MATRIC_RESULT: 'Matric Result Card',
}

function isImage(mimeType) {
    return mimeType?.startsWith('image/')
}

// ── Single upload slot ──────────────────────────────────────────────────────
function DocSlot({studentId, type, label, doc, onChanged}) {
    const {toast} = useToast()
    const fileInputRef = useRef(null)
    const [uploading, setUploading] = useState(false)
    const [removing, setRemoving] = useState(false)
    const [viewing, setViewing] = useState(false)

    const handleFile = async (e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return
        if (file.size > MAX_FILE_MB * 1024 * 1024) {
            toast({variant: 'destructive', title: 'File too large', description: `Max ${MAX_FILE_MB}MB`})
            return
        }
        setUploading(true)
        try {
            await studentsAPI.uploadDocument(studentId, type, file)
            toast({title: 'Uploaded', description: `${label} saved`})
            onChanged()
        } catch (err) {
            toast({variant: 'destructive', title: 'Upload failed', description: err.response?.data?.errors?.message || err.response?.data?.message || 'Please try again.'})
        } finally {
            setUploading(false)
        }
    }

    const handleRemove = async () => {
        if (!doc) return
        setRemoving(true)
        try {
            await studentsAPI.deleteDocument(studentId, doc.id)
            toast({title: 'Document removed'})
            onChanged()
        } catch {
            toast({variant: 'destructive', title: 'Failed to remove'})
        } finally {
            setRemoving(false)
        }
    }

    const handleView = async () => {
        if (!doc) return
        setViewing(true)
        try {
            const res = await studentsAPI.getDocumentFile(studentId, doc.id)
            const url = window.URL.createObjectURL(res.data)
            window.open(url, '_blank')
        } catch {
            toast({variant: 'destructive', title: 'Failed to open document'})
        } finally {
            setViewing(false)
        }
    }

    const busy = uploading || removing

    return (
        <div className={`rounded-lg border p-3 flex items-center gap-3 transition-colors ${
            doc ? 'border-emerald-200 dark:border-emerald-400/25 bg-emerald-50/40 dark:bg-emerald-400/5' : 'border-dashed border-gray-200 dark:border-dark-700'
        }`}>
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                doc ? 'bg-emerald-100 dark:bg-emerald-400/15 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 dark:bg-dark-800 text-gray-400 dark:text-dark-500'
            }`}>
                {doc ? (isImage(doc.mimeType) ? <ImageIcon className="h-4 w-4"/> : <FileText className="h-4 w-4"/>) : <Upload className="h-4 w-4"/>}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-dark-200 truncate">{label}</p>
                {doc ? (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3"/> Uploaded
                    </p>
                ) : (
                    <p className="text-[11px] text-gray-400 dark:text-dark-500">Not uploaded</p>
                )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                {doc && (
                    <button
                        type="button" onClick={handleView} disabled={busy || viewing}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-dark-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-400/10 transition-colors disabled:opacity-50"
                        title="View"
                    >
                        {viewing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Eye className="h-4 w-4"/>}
                    </button>
                )}
                <button
                    type="button" onClick={() => fileInputRef.current?.click()} disabled={busy}
                    className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-medium border border-gray-200 dark:border-dark-700 text-gray-600 dark:text-dark-300 hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors disabled:opacity-50"
                >
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Upload className="h-3.5 w-3.5"/>}
                    {doc ? 'Replace' : 'Upload'}
                </button>
                {doc && (
                    <button
                        type="button" onClick={handleRemove} disabled={busy}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 dark:text-dark-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-400/10 transition-colors disabled:opacity-50"
                        title="Remove"
                    >
                        {removing ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                    </button>
                )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFile}/>
        </div>
    )
}

// ── Section wrapper ──────────────────────────────────────────────────────────
function Section({icon: Icon, title, subtitle, children}) {
    return (
        <div className="rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-dark-850 border-b border-gray-200 dark:border-dark-700">
                <Icon className="h-4 w-4 text-gray-500 dark:text-dark-400 shrink-0"/>
                <div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-dark-200">{title}</span>
                    {subtitle && <span className="ml-2 text-[11px] text-gray-400 dark:text-dark-500">{subtitle}</span>}
                </div>
            </div>
            <div className="p-3 space-y-2">
                {children}
            </div>
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StudentDocuments({studentId}) {
    const {toast} = useToast()
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [identityMode, setIdentityMode] = useState('BFORM')

    const fetchDocuments = async () => {
        try {
            const res = await studentsAPI.getDocuments(studentId)
            const docs = res.data.documents || []
            setDocuments(docs)
            if (docs.some(d => d.type === 'CNIC_FRONT' || d.type === 'CNIC_BACK')) setIdentityMode('CNIC')
            else if (docs.some(d => d.type === 'BFORM')) setIdentityMode('BFORM')
        } catch {
            toast({variant: 'destructive', title: 'Failed to load documents'})
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (studentId) fetchDocuments()
    }, [studentId])

    const byType = (type) => documents.find(d => d.type === type)

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-dark-500 py-8 justify-center">
                <Loader2 className="h-4 w-4 animate-spin"/>
                Loading documents...
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <Section icon={UserSquare2} title="Photo">
                <DocSlot studentId={studentId} type="PHOTO" label={TYPE_LABELS.PHOTO} doc={byType('PHOTO')} onChanged={fetchDocuments}/>
            </Section>

            <Section icon={IdCard} title="Identity Document" subtitle="B-Form or CNIC — pick one">
                <div className="flex gap-2 mb-1">
                    <button
                        type="button"
                        onClick={() => setIdentityMode('BFORM')}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                            identityMode === 'BFORM'
                                ? 'border-primary-400 bg-primary-50 dark:bg-primary-400/10 text-primary-700 dark:text-primary-400'
                                : 'border-gray-200 dark:border-dark-700 text-gray-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-800'
                        }`}
                    >
                        B-Form (minor)
                    </button>
                    <button
                        type="button"
                        onClick={() => setIdentityMode('CNIC')}
                        className={`flex-1 text-xs font-medium py-1.5 rounded-lg border transition-colors ${
                            identityMode === 'CNIC'
                                ? 'border-primary-400 bg-primary-50 dark:bg-primary-400/10 text-primary-700 dark:text-primary-400'
                                : 'border-gray-200 dark:border-dark-700 text-gray-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-800'
                        }`}
                    >
                        CNIC (adult)
                    </button>
                </div>
                {identityMode === 'BFORM' ? (
                    <DocSlot studentId={studentId} type="BFORM" label={TYPE_LABELS.BFORM} doc={byType('BFORM')} onChanged={fetchDocuments}/>
                ) : (
                    <>
                        <DocSlot studentId={studentId} type="CNIC_FRONT" label={TYPE_LABELS.CNIC_FRONT} doc={byType('CNIC_FRONT')} onChanged={fetchDocuments}/>
                        <DocSlot studentId={studentId} type="CNIC_BACK" label={TYPE_LABELS.CNIC_BACK} doc={byType('CNIC_BACK')} onChanged={fetchDocuments}/>
                        {(!byType('CNIC_FRONT') || !byType('CNIC_BACK')) && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-1">Both front and back are required for CNIC.</p>
                        )}
                    </>
                )}
            </Section>

            <Section icon={IdCard} title="Father's CNIC" subtitle="Both sides required">
                <DocSlot studentId={studentId} type="FATHER_CNIC_FRONT" label={TYPE_LABELS.FATHER_CNIC_FRONT} doc={byType('FATHER_CNIC_FRONT')} onChanged={fetchDocuments}/>
                <DocSlot studentId={studentId} type="FATHER_CNIC_BACK" label={TYPE_LABELS.FATHER_CNIC_BACK} doc={byType('FATHER_CNIC_BACK')} onChanged={fetchDocuments}/>
                {(!byType('FATHER_CNIC_FRONT') || !byType('FATHER_CNIC_BACK')) && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 pt-1">Both front and back are required.</p>
                )}
            </Section>

            <Section icon={FileText} title="Matric Result Card">
                <DocSlot studentId={studentId} type="MATRIC_RESULT" label={TYPE_LABELS.MATRIC_RESULT} doc={byType('MATRIC_RESULT')} onChanged={fetchDocuments}/>
            </Section>
        </div>
    )
}
