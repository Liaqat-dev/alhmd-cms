import { BookOpen, Layers } from 'lucide-react'

const ACCENT_CLASSES = [
    'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border-blue-200/60 dark:border-blue-800/40',
    'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 border-violet-200/60 dark:border-violet-800/40',
    'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30 border-teal-200/60 dark:border-teal-800/40',
    'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-800/40',
    'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-200/60 dark:border-amber-800/40',
]

function ClassRow({ cls, idx }) {
    const accentClass = ACCENT_CLASSES[idx % ACCENT_CLASSES.length]
    const subjectCount = cls.subjects?.length || 0

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-border hover:bg-muted/30 transition-all duration-150 group">
            {/* Class badge */}
            <div className={`flex-shrink-0 h-9 w-9 rounded-lg border flex items-center justify-center ${accentClass}`}>
                <span className="cga-num text-xs font-bold leading-none">
                    {(cls.name || '?').substring(0, 2).toUpperCase()}
                </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate leading-tight">{cls.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                    {subjectCount} subject{subjectCount !== 1 ? 's' : ''}
                </p>
            </div>

            {/* Subject pills */}
            {subjectCount > 0 && (
                <div className="flex-shrink-0 flex -space-x-1">
                    {cls.subjects.slice(0, 3).map((s, i) => (
                        <div
                            key={s.id ?? i}
                            className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center"
                            title={s.name}
                        >
                            <span className="text-[8px] font-bold text-muted-foreground">
                                {(s.name || '?')[0].toUpperCase()}
                            </span>
                        </div>
                    ))}
                    {subjectCount > 3 && (
                        <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                            <span className="text-[8px] font-bold text-muted-foreground">+{subjectCount - 3}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function ClassStats({ classes = [] }) {
    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Layers className="h-4 w-4 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="cga-display text-lg font-bold text-foreground tracking-tight">
                            Your Classes
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Enrolled programs</p>
                    </div>
                </div>
                {classes.length > 0 && (
                    <div className="h-6 min-w-6 px-2 flex items-center justify-center rounded-full bg-primary/10">
                        <span className="cga-num text-xs font-bold text-primary">{classes.length}</span>
                    </div>
                )}
            </div>

            <div className="p-5">
                {classes.length > 0 ? (
                    <div className="space-y-2">
                        {classes.map((cls, idx) => (
                            <ClassRow key={cls.id ?? idx} cls={cls} idx={idx} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <div className="h-11 w-11 rounded-full bg-muted border border-border flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No classes enrolled</p>
                        <p className="text-xs text-muted-foreground text-center">
                            Contact your admin to get enrolled.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
