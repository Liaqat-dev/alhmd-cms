/**
 * admin-table.jsx — Shared primitives for admin list pages
 *
 * PagePanel     — card with icon header, title, count + Add button
 * TableSpinner  — centered spinner for loading state
 * TableEmpty    — empty-state row spanning all columns
 * ActionButtons — edit + optional extras + delete icon button cluster
 * ClassBadge    — small class-name pill
 */

import {useEffect, useRef, useState} from 'react'
import {ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {TableCell, TableRow} from '@/components/ui/table'
import {cn} from '@/lib/utils'

// ── PagePanel ─────────────────────────────────────────────────────────────────

export function PagePanel({
                              icon: Icon,
                              iconBg = "bg-primary-500/10 dark:bg-primary-500/15",
                              iconColor = "text-primary-600 dark:text-primary-400",
                              title,
                              count,
                              countLabel = 'total',
                              addLabel,
                              onAdd,
                              children,
                          }) {
    return (
        <div className="card">
            <div className="flex flex-col xs:flex-row gap-2 items-start xs:items-centre xs:justify-between card-header p-2 xs:p-4">
                <div className="flex items-center gap-3">
                    <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconBg)}>
                        <Icon className={cn('h-5 w-5', iconColor)}/>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg tracking-tight text-gray-800 dark:text-dark-100">{title}</h3>
                        <p className="text-xs text-gray-400 dark:text-dark-500">
                            {count} {countLabel}
                        </p>
                    </div>
                </div>
                {addLabel && (
                    <Button className={'w-full xs:w-fit'} onClick={onAdd}>
                        <Plus className="h-4 w-4 mr-2"/>
                        {addLabel}
                    </Button>
                )}
            </div>
            <div className="p-2 sm:p-6">{children}</div>
        </div>
    )
}

// ── TableSpinner ──────────────────────────────────────────────────────────────

export function TableSpinner({label = 'Loading...'}) {
    return (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500/20 border-t-primary-500"/>
            <p className="text-sm text-gray-400 dark:text-dark-500">{label}</p>
        </div>
    )
}

// ── TableEmpty ────────────────────────────────────────────────────────────────

export function TableEmpty({icon: Icon, label, colSpan = 6}) {
    return (
        <TableRow>
            <TableCell colSpan={colSpan} className="h-32">
                <div className="flex flex-col items-center justify-center gap-2">
                    <div className="rounded-full bg-gray-100 dark:bg-dark-800 p-3">
                        <Icon className="h-5 w-5 text-gray-400 dark:text-dark-500"/>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-dark-400">{label}</p>
                </div>
            </TableCell>
        </TableRow>
    )
}

// ── ActionButtons ─────────────────────────────────────────────────────────────

export function ActionButtons({onEdit, onDelete, extra}) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    return (
        <div ref={ref} className="relative inline-block">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-dark-800"
                onClick={() => setOpen(v => !v)}
            >
                <MoreHorizontal className="h-4 w-4 text-gray-500 dark:text-dark-400"/>
            </Button>

            {open && (
                <div className="absolute right-0 z-50 mt-1 w-36 rounded-lg border border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-900 shadow-lg py-1">
                    {extra}
                    {onEdit && (
                        <button
                            type="button"
                            onClick={() => { setOpen(false); onEdit() }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-dark-200 hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                        >
                            <Pencil className="h-3.5 w-3.5 text-gray-400 dark:text-dark-500"/>
                            Edit
                        </button>
                    )}
                    {onDelete && (
                        <button
                            type="button"
                            onClick={() => { setOpen(false); onDelete() }}
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-400/10 transition-colors"
                        >
                            <Trash2 className="h-3.5 w-3.5"/>
                            Delete
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}

// ── TablePagination ───────────────────────────────────────────────────────────

export function TablePagination({total, page, pageSize, onPageChange}) {
    const totalPages = Math.ceil(total / pageSize)
    if (totalPages <= 1) return null

    const from = (page - 1) * pageSize + 1
    const to = Math.min(page * pageSize, total)

    const delta = 2
    const pages = []
    for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
        pages.push(i)
    }

    const btnBase = 'h-8 min-w-8 px-2 rounded border text-sm flex items-center justify-center transition-colors'
    const btnNormal = 'border-gray-200 dark:border-dark-700 hover:bg-gray-100 dark:hover:bg-dark-800 text-gray-600 dark:text-dark-300'
    const btnActive = 'border-primary-500 bg-primary-500/10 text-primary-600 dark:text-primary-400 font-semibold'
    const btnDisabled = 'opacity-40 cursor-not-allowed'

    return (
        <div className="flex flex-col xs:flex-row items-center justify-between mt-4 text-sm text-gray-500 dark:text-dark-400">
            <span>Showing {from}–{to} of {total}</span>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className={cn(btnBase, btnNormal, page === 1 && btnDisabled)}
                >
                    <ChevronLeft className="h-4 w-4"/>
                </button>

                {pages[0] > 1 && (
                    <>
                        <button onClick={() => onPageChange(1)} className={cn(btnBase, btnNormal)}>1</button>
                        {pages[0] > 2 && <span className="px-1 text-gray-400">…</span>}
                    </>
                )}

                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={cn(btnBase, p === page ? btnActive : btnNormal)}
                    >
                        {p}
                    </button>
                ))}

                {pages[pages.length - 1] < totalPages && (
                    <>
                        {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-gray-400">…</span>}
                        <button onClick={() => onPageChange(totalPages)} className={cn(btnBase, btnNormal)}>{totalPages}</button>
                    </>
                )}

                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page === totalPages}
                    className={cn(btnBase, btnNormal, page === totalPages && btnDisabled)}
                >
                    <ChevronRight className="h-4 w-4"/>
                </button>
            </div>
        </div>
    )
}

// ── ClassBadge ────────────────────────────────────────────────────────────────

export function ClassBadge({name}) {
    return (
        <span
            className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset bg-amber-50 dark:bg-amber-400/15 text-amber-700 dark:text-amber-300 ring-amber-600/10 dark:ring-amber-400/20"
        >
      {name}
    </span>
    )
}
