-- DropIndex
DROP INDEX "EveningTimetable_eveningClassId_dayOfWeek_startTime_key";

-- CreateIndex
CREATE INDEX "EveningTimetable_eveningClassId_dayOfWeek_idx" ON "EveningTimetable"("eveningClassId", "dayOfWeek");
