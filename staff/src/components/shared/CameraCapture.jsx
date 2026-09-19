import {useCallback, useEffect, useRef, useState} from 'react'
import {useToast} from '@/hooks/use-toast'
import {Camera, Loader2, RefreshCw, RotateCcw, SwitchCamera} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'

const JPEG_QUALITY = 0.92

function errorMessage(err) {
    switch (err?.name) {
        case 'NotAllowedError':
        case 'SecurityError':
            return 'Camera permission denied. Allow camera access in your browser settings and try again.'
        case 'NotFoundError':
        case 'OverconstrainedError':
            return 'No camera found on this device.'
        case 'NotReadableError':
            return 'The camera is being used by another application. Close it and try again.'
        default:
            return err?.message || 'Unable to start the camera.'
    }
}

/**
 * Live camera capture dialog. Calls onCapture(file) with a JPEG File once the
 * user confirms a shot; the parent closes the dialog when the upload settles.
 */
export default function CameraCapture({open, onOpenChange, title = 'Take Picture', fileName = 'capture', onCapture, busy = false}) {
    const {toast} = useToast()
    const videoRef = useRef(null)
    const canvasRef = useRef(null)
    const streamRef = useRef(null)

    const [facingMode, setFacingMode] = useState('environment')
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false)
    const [starting, setStarting] = useState(true)
    const [error, setError] = useState(null)
    const [shot, setShot] = useState(null)

    const stopStream = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        if (videoRef.current) videoRef.current.srcObject = null
    }, [])

    const startStream = useCallback(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setStarting(false)
            setError('This browser does not support camera access. Use the Upload button instead.')
            return
        }
        setStarting(true)
        setError(null)
        stopStream()
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {facingMode, width: {ideal: 1920}, height: {ideal: 1080}},
                audio: false,
            })
            streamRef.current = stream
            if (videoRef.current) {
                videoRef.current.srcObject = stream
                await videoRef.current.play().catch(() => {})
            }
            const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [])
            setHasMultipleCameras(devices.filter(d => d.kind === 'videoinput').length > 1)
        } catch (err) {
            stopStream()
            setError(errorMessage(err))
        } finally {
            setStarting(false)
        }
    }, [facingMode, stopStream])

    useEffect(() => {
        if (!open) {
            stopStream()
            setShot(null)
            setError(null)
            return
        }
        startStream()
        return stopStream
    }, [open, startStream, stopStream])

    const handleCapture = () => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas || !video.videoWidth) return
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
        setShot(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
        stopStream()
    }

    const handleRetake = () => {
        setShot(null)
        startStream()
    }

    const handleConfirm = () => {
        const canvas = canvasRef.current
        if (!canvas || !shot) return
        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    toast({variant: 'destructive', title: 'Could not process the photo', description: 'Please retake it.'})
                    return
                }
                onCapture(new File([blob], `${fileName}-${Date.now()}.jpg`, {type: 'image/jpeg'}))
            },
            'image/jpeg',
            JPEG_QUALITY,
        )
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { if (!busy) onOpenChange(next) }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>

                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-900">
                    {shot ? (
                        <img src={shot} alt="Captured preview" className="h-full w-full object-contain"/>
                    ) : (
                        <video ref={videoRef} playsInline muted className="h-full w-full object-cover"/>
                    )}

                    {!shot && starting && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-white/80">
                            <Loader2 className="h-4 w-4 animate-spin"/> Starting camera...
                        </div>
                    )}

                    {!shot && error && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                            <p className="text-sm text-white/90">{error}</p>
                            <Button type="button" variant="outline" size="sm" onClick={startStream}>
                                <RefreshCw className="mr-1.5 h-3.5 w-3.5"/> Retry
                            </Button>
                        </div>
                    )}

                    {!shot && !error && hasMultipleCameras && (
                        <button
                            type="button"
                            onClick={() => setFacingMode(m => (m === 'environment' ? 'user' : 'environment'))}
                            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
                            title="Switch camera"
                        >
                            <SwitchCamera className="h-4 w-4"/>
                        </button>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden"/>

                <DialogFooter className="gap-2 sm:gap-2">
                    {shot ? (
                        <>
                            <Button type="button" variant="outline" onClick={handleRetake} disabled={busy}>
                                <RotateCcw className="mr-1.5 h-4 w-4"/> Retake
                            </Button>
                            <Button type="button" onClick={handleConfirm} disabled={busy}>
                                {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin"/> : null}
                                {busy ? 'Uploading...' : 'Use Photo'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="button" onClick={handleCapture} disabled={starting || !!error}>
                                <Camera className="mr-1.5 h-4 w-4"/> Capture
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
