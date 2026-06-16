/**
 * FollowUpSection — Follow-up appointment scheduler within the Consultation Workspace.
 * Matches Stitch "Schedule Follow-up" card layout.
 */

interface FollowUpSectionProps {
  followUpDate: string
  followUpTime: string
  followUpNotes: string
  isReadOnly: boolean
  isPending: boolean
  existingFollowUp?: string | null
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  onNotesChange: (notes: string) => void
  onSchedule: () => void
}

export default function FollowUpSection({
  followUpDate,
  followUpTime,
  followUpNotes,
  isReadOnly,
  isPending,
  existingFollowUp,
  onDateChange,
  onTimeChange,
  onNotesChange,
  onSchedule,
}: FollowUpSectionProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl p-lg shadow-sm border border-outline-variant/30 space-y-md">
      <div className="flex items-center gap-sm text-primary">
        <span className="material-symbols-outlined text-[24px]">event_upcoming</span>
        <h3 className="text-title-lg font-bold text-on-surface">Schedule Follow-up</h3>
      </div>

      {/* Show existing follow-up if set */}
      {existingFollowUp && (
        <div className="flex items-center gap-sm p-sm rounded-lg bg-primary-container/20 border border-primary-fixed-dim">
          <span className="material-symbols-outlined text-[18px] text-primary">event_available</span>
          <div>
            <p className="text-xs font-semibold text-primary">Follow-up Scheduled</p>
            <p className="text-sm text-on-surface font-medium">
              {new Date(existingFollowUp).toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}{' '}
              at{' '}
              {new Date(existingFollowUp).toLocaleTimeString('en-GB', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-md">
        <div className="grid grid-cols-2 gap-sm">
          {/* Date */}
          <div>
            <label className="block text-label-md font-semibold text-on-surface-variant mb-xs">Date</label>
            <input
              type="date"
              value={followUpDate}
              disabled={isReadOnly}
              onChange={(e) => onDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="form-input text-sm py-1.5 w-full"
            />
          </div>
          {/* Time */}
          <div>
            <label className="block text-label-md font-semibold text-on-surface-variant mb-xs">Time</label>
            <select
              value={followUpTime}
              disabled={isReadOnly}
              onChange={(e) => onTimeChange(e.target.value)}
              className="form-input text-sm py-1.5 cursor-pointer w-full"
            >
              <option value="09:00">09:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:30">11:30 AM</option>
              <option value="14:00">02:00 PM</option>
              <option value="15:30">03:30 PM</option>
              <option value="16:30">04:30 PM</option>
            </select>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-label-md font-semibold text-on-surface-variant mb-xs">
            Follow-up Notes
          </label>
          <input
            type="text"
            value={followUpNotes}
            disabled={isReadOnly}
            onChange={(e) => onNotesChange(e.target.value)}
            className="form-input text-sm py-1.5 w-full"
            placeholder="Briefly state target for next visit..."
          />
        </div>

        {!isReadOnly && (
          <button
            type="button"
            onClick={onSchedule}
            disabled={isPending}
            className="w-full py-sm bg-primary text-on-primary rounded-lg font-label-lg hover:bg-primary-hover transition-colors shadow-sm flex items-center justify-center gap-xs"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_today</span>
            {isPending ? 'Scheduling...' : 'Schedule Follow-up'}
          </button>
        )}
      </div>
    </div>
  )
}
