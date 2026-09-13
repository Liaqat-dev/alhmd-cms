import { Megaphone, Clock } from 'lucide-react'

const PRIORITY_CFG = {
    URGENT: { bar: 'bg-red-500', badge: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200/60 dark:border-red-800/40', dot: 'bg-red-500', label: 'Urgent' },
    HIGH:   { bar: 'bg-red-400', badge: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200/50 dark:border-red-800/30', dot: 'bg-red-400', label: 'High' },
    NORMAL: { bar: 'bg-primary/60', badge: 'bg-primary/8 text-primary border-primary/20', dot: 'bg-primary/60', label: 'Notice' },
    INFORMATIONAL: { bar: 'bg-blue-400/80', badge: 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/30', dot: 'bg-blue-400', label: 'Info' },
    LOW:    { bar: 'bg-muted-foreground/40', badge: 'bg-muted text-muted-foreground border-border', dot: 'bg-muted-foreground/40', label: 'Low' },
}

function timeAgo(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function AnnouncementCard({ ann, idx }) {
    const cfg = PRIORITY_CFG[ann.priority] || PRIORITY_CFG.NORMAL
    const date = ann.publishedAt || ann.createdAt

    return (
        <div
            className="group relative flex gap-4 rounded-xl border border-border/60 bg-card hover:border-border hover:shadow-sm transition-all duration-200 overflow-hidden p-4"
            style={{ animationDelay: `${idx * 50}ms` }}
        >
            {/* Priority bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${cfg.bar} rounded-l-xl`} />

            <div className="flex-1 min-w-0 pl-1">
                {/* Top row */}
                <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="cga-display text-sm font-semibold text-foreground leading-snug">
                        {ann.title}
                    </h3>
                    <span className={`flex-shrink-0 text-[10px] font-semibold uppercase tracking-[0.08em] px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                        {cfg.label}
                    </span>
                </div>

                {/* Body */}
                {ann.content && (
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {ann.content}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-border/40">
                    <Clock className="h-3 w-3 text-muted-foreground/60 flex-shrink-0" />
                    <span className="text-[11px] text-muted-foreground">{timeAgo(date)}</span>
                </div>
            </div>
        </div>
    )
}

export default function AnnouncementsSection({ announcements = [], limit = 5 }) {
    const display = announcements.slice(0, limit)
    const hasMore = announcements.length > limit

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Megaphone className="h-4 w-4 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="cga-display text-lg font-bold text-foreground tracking-tight">
                            Announcements
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Latest updates & notices</p>
                    </div>
                </div>
                {announcements.length > 0 && (
                    <div className="h-6 min-w-6 px-2 flex items-center justify-center rounded-full bg-primary/10">
                        <span className="cga-num text-xs font-bold text-primary">{announcements.length}</span>
                    </div>
                )}
            </div>

            <div className="p-5">
                {display.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                            {display.map((ann, idx) => (
                                <AnnouncementCard key={ann.id ?? idx} ann={ann} idx={idx} />
                            ))}
                        </div>

                        {hasMore && (
                            <div className="mt-4 pt-4 border-t border-border/40 text-center">
                                <button className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                                    View all {announcements.length} announcements →
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="h-11 w-11 rounded-full bg-muted border border-border flex items-center justify-center">
                            <Megaphone className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No announcements yet</p>
                        <p className="text-xs text-muted-foreground">Check back later for updates.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
