import { Clock, MapPin, User2, BookOpen } from 'lucide-react'

function fmtTime(iso) {
    const d = new Date(iso)
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
}

function LectureCard({ lecture }) {
    const now = new Date()
    const start = new Date(lecture.startTime)
    const end = new Date(lecture.endTime)
    const isNow = now >= start && now < end
    const isPast = now >= end

    const statusRing = isNow
        ? 'ring-2 ring-primary/40 border-primary/40 bg-primary/5'
        : isPast
        ? 'border-border/40 opacity-50'
        : 'border-border hover:border-primary/30 hover:shadow-sm'

    const dotColor = isNow ? 'bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]'
        : isPast ? 'bg-muted-foreground/30'
        : 'bg-foreground/25'

    return (
        <div className={`flex gap-4`}>
            {/* Time column */}
            <div className="flex flex-col items-center flex-shrink-0 w-11">
                <span className="cga-num text-xs font-semibold text-muted-foreground tabular-nums leading-tight">
                    {fmtTime(lecture.startTime)}
                </span>
                <div className={`mt-1.5 h-2.5 w-2.5 rounded-full ${dotColor} transition-all duration-300`} />
                <div className="flex-1 w-px bg-border/40 mt-1.5" />
            </div>

            {/* Card */}
            <div className={`flex-1 mb-3 rounded-xl border p-3.5 transition-all duration-200 ${statusRing}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground leading-tight truncate">
                            {lecture.subject?.name || 'Class'}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {lecture.class?.name}
                        </p>
                    </div>
                    {isNow && (
                        <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/25">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                            <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">Live</span>
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        {fmtTime(lecture.startTime)} – {fmtTime(lecture.endTime)}
                    </span>
                    {lecture.room && (
                        <span className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            {lecture.room}
                        </span>
                    )}
                    {lecture.teacher?.name && (
                        <span className="flex items-center gap-1.5">
                            <User2 className="h-3 w-3 flex-shrink-0" />
                            {lecture.teacher.name}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function TodaysLectures({ lectures = [] }) {
    const today = new Date()
    const todayLectures = (lectures || [])
        .filter(l => new Date(l.startTime).toDateString() === today.toDateString())
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

    const dateLabel = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" strokeWidth={2} />
                    </div>
                    <div>
                        <h2 className="cga-display text-lg font-bold text-foreground tracking-tight">
                            Today's Schedule
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">{dateLabel}</p>
                    </div>
                </div>
                {todayLectures.length > 0 && (
                    <div className="h-6 w-6 flex items-center justify-center rounded-full bg-primary/10">
                        <span className="cga-num text-xs font-bold text-primary">{todayLectures.length}</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-5">
                {todayLectures.length > 0 ? (
                    <div>
                        {todayLectures.map(lecture => (
                            <LectureCard key={lecture.id} lecture={lecture} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="h-11 w-11 rounded-full bg-muted border border-border flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">No classes today</p>
                        <p className="text-xs text-muted-foreground text-center">Enjoy your free day!</p>
                    </div>
                )}
            </div>
        </div>
    )
}
