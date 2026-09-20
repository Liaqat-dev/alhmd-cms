/**
 * ConfirmPhraseDialog — a confirmation that can't be clicked through.
 *
 * For operations that rewrite a whole cohort at once and have no undo. The
 * action stays disabled until the phrase is typed back exactly, the way GitHub
 * guards deleting a repository.
 *
 * Anything the admin needs to *choose* (a target class, say) goes in
 * `children`, above the confirmation step, with `canConfirm` gating the action
 * on that choice. Pass `blocked` when there's nothing valid to do — the form is
 * replaced by an explanation and no action button.
 */

import {useEffect, useState} from 'react'
import {AlertTriangle, Loader2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {ServerError} from '@/components/ui/form-fields'

export default function ConfirmPhraseDialog({
                                                open,
                                                onOpenChange,
                                                title,
                                                description,
                                                phrase,
                                                actionLabel,
                                                destructive = false,
                                                loading = false,
                                                canConfirm = true,
                                                blocked = null,
                                                error = null,
                                                onDismissError,
                                                onConfirm,
                                                children,
                                            }) {
    const [typed, setTyped] = useState('')

    // Never carry a half-typed phrase — or a stale error — into the next open.
    useEffect(() => {
        if (!open) setTyped('')
    }, [open])

    const matches = typed === phrase

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg bg-white dark:bg-dark-900">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 pr-6">
                        {destructive && <AlertTriangle className="h-4.5 w-4.5 shrink-0 text-red-500"/>}
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {description && !blocked && (
                        <p className="text-sm leading-relaxed text-gray-500 dark:text-dark-400">{description}</p>
                    )}

                    <ServerError message={error} onDismiss={onDismissError}/>

                    {blocked ? (
                        <div className="rounded-xl border border-amber-200 dark:border-amber-400/25 bg-amber-50 dark:bg-amber-400/10 px-4 py-3">
                            <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-200">{blocked}</p>
                        </div>
                    ) : (
                        <>
                            {children}

                            <div className="space-y-1.5">
                                <label
                                    htmlFor="confirm-phrase"
                                    className="block text-sm text-gray-600 dark:text-dark-300"
                                >
                                    Type{' '}
                                    <code className="rounded bg-gray-100 dark:bg-dark-800 px-1.5 py-0.5 font-mono text-[13px] font-semibold text-gray-800 dark:text-dark-100 select-none">
                                        {phrase}
                                    </code>{' '}
                                    to confirm.
                                </label>
                                <Input
                                    id="confirm-phrase"
                                    value={typed}
                                    onChange={(e) => setTyped(e.target.value)}
                                    placeholder={phrase}
                                    autoComplete="off"
                                    spellCheck={false}
                                    className="font-mono"
                                />
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        {blocked ? 'Close' : 'Cancel'}
                    </Button>
                    {!blocked && (
                        <Button
                            type="button"
                            variant={destructive ? 'destructive' : 'default'}
                            disabled={!matches || !canConfirm || loading}
                            onClick={onConfirm}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                            {actionLabel}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
