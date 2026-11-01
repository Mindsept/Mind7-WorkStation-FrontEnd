import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Coffee,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { api } from "../api/client";
import type { AttendanceEvent, AttendanceInput, Member } from "../api/types";
import {
  calendarDate,
  Confirm,
  Empty,
  ErrorNotice,
  Field,
  Loading,
  Modal,
  todayParis,
} from "../components/ui";
import { ActionButton, useOperationGuard } from "../components/action-button";
import { IllustratedCard } from "../components/illustrated-card";
import { Avatar } from "../features/profile/avatar";
function EventEditor({
  event,
  members,
  memberId,
  onClose,
}: {
  event?: AttendanceEvent;
  members: Member[];
  memberId?: string;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(event?.member_id || memberId || "");
  const [type, setType] = useState<"late" | "absent">(
    event?.event_type || "late",
  );
  const [date, setDate] = useState(event?.event_date || todayParis());
  const [minutes, setMinutes] = useState(event?.minutes_late?.toString() || "");
  const [note, setNote] = useState(event?.note || "");
  const [busy, setBusy] = useState(false);
  const guard = useOperationGuard();
  const [error, setError] = useState<unknown>();
  const client = useQueryClient();
  return (
    <Modal
      title={event ? "Edit attendance event" : "Record attendance"}
      description="One event per member per date. Correct an existing event to change its classification."
      onClose={onClose}
      busy={busy}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!guard.start()) return;
          setBusy(true);
          setError(undefined);
          const input: AttendanceInput = {
            member_id: selected,
            event_type: type,
            event_date: date,
            minutes_late: type === "late" && minutes ? Number(minutes) : null,
            note: note.trim() || null,
          };
          try {
            await api.saveEvent(input, event?.id);
            await client.invalidateQueries({ queryKey: ["attendance"] });
            if (guard.active()) onClose();
          } catch (e) {
            if (guard.active()) setError(e);
          } finally {
            guard.finish();
            if (guard.active()) setBusy(false);
          }
        }}
      >
        <Field label="Team member">
          {(id) => (
            <select
              id={id}
              required
              value={selected}
              disabled={busy}
              onChange={(e) => setSelected(e.target.value)}
              autoFocus
            >
              <option value="" disabled>
                Select a team member
              </option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.display_name || m.email || m.id}
                </option>
              ))}
            </select>
          )}
        </Field>
        <div className="form-grid">
          <Field label="Event type">
            {(id) => (
              <select
                id={id}
                value={type}
                disabled={busy}
                onChange={(e) => setType(e.target.value as "late" | "absent")}
              >
                <option value="late">Late arrival</option>
                <option value="absent">Absence</option>
              </select>
            )}
          </Field>
          <Field label="Event date">
            {(id) => (
              <input
                id={id}
                type="date"
                required
                value={date}
                disabled={busy}
                onChange={(e) => setDate(e.target.value)}
              />
            )}
          </Field>
        </div>
        {type === "late" && (
          <Field
            label="Minutes late"
            hint="Optional. Enter a positive whole number."
          >
            {(id) => (
              <input
                id={id}
                type="number"
                min={1}
                max={1440}
                step={1}
                value={minutes}
                disabled={busy}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="e.g. 10"
              />
            )}
          </Field>
        )}
        <Field
          label="Note"
          hint="Optional. Add only the context your team needs."
        >
          {(id) => (
            <textarea
              id={id}
              rows={3}
              maxLength={2000}
              value={note}
              disabled={busy}
              onChange={(e) => setNote(e.target.value)}
            />
          )}
        </Field>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <button
            type="button"
            disabled={busy}
            className="button secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <ActionButton pending={busy} disabled={!selected}>
            {event ? "Save changes" : "Record event"}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
}
export function AttendancePage({
  canManageAttendance,
}: {
  canManageAttendance: boolean;
}) {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [range, setRange] = useState({ date_from: "", date_to: "" });
  const [rangeError, setRangeError] = useState<unknown>();
  const [editor, setEditor] = useState<AttendanceEvent | "new">();
  const [remove, setRemove] = useState<AttendanceEvent>();
  const members = useQuery({ queryKey: ["members"], queryFn: api.members });
  const summary = useQuery({
    queryKey: ["attendance", "summary", range],
    queryFn: () => api.summary(range),
  });
  const events = useQuery({
    queryKey: ["attendance", "events", memberId, range],
    queryFn: () => api.events({ ...range, member_id: memberId }),
    enabled: !!memberId,
  });
  const member = members.data?.items.find((m) => m.id === memberId);
  const rows = members.data?.items || [];
  const aggregates = summary.data?.items || [];
  const lateTotal = rows.reduce(
    (n, m) =>
      n + (aggregates.find((s) => s.member_id === m.id)?.late_count || 0),
    0,
  );
  const absentTotal = rows.reduce(
    (n, m) =>
      n + (aggregates.find((s) => s.member_id === m.id)?.absence_count || 0),
    0,
  );
  return (
    <section className="portal-page attendance-view">
      <div className="page-heading attendance-heading">
        <div>
          <span className="eyebrow">TEAM ATTENDANCE</span>
          <h1>
            Croissantage
            <span className="heading-icon">
              <Coffee size={29} />
            </span>
          </h1>
          <p>Late arrivals, absences and the people behind the work.</p>
        </div>
        {canManageAttendance && (
          <ActionButton
            className="button primary"
            onClick={() => setEditor("new")}
          >
            <Plus size={17} />
            Record attendance
          </ActionButton>
        )}
      </div>
      <IllustratedCard
        image="/assets/card-team-v5.webp"
        className="attendance-illustration"
      >
        <div className="attendance-summary">
          <div>
            <span className="metric-icon forest">
              <Users size={23} />
            </span>
            <span>
              <small>Active team members</small>
              <strong>{members.data?.total ?? "—"}</strong>
            </span>
          </div>
          <div>
            <span className="metric-icon gold">
              <Clock3 size={23} />
            </span>
            <span>
              <small>Late arrivals</small>
              <strong>{summary.data ? lateTotal : "—"}</strong>
            </span>
          </div>
          <div>
            <span className="metric-icon blue">
              <CalendarDays size={23} />
            </span>
            <span>
              <small>Absences</small>
              <strong>{summary.data ? absentTotal : "—"}</strong>
            </span>
          </div>
        </div>
      </IllustratedCard>
      <form
        className="date-filters"
        onSubmit={(e) => {
          e.preventDefault();
          if (from && to && from > to) {
            setRangeError(
              new Error("The start date must be on or before the end date."),
            );
            return;
          }
          setRangeError(undefined);
          setRange({ date_from: from, date_to: to });
        }}
      >
        <div>
          <CalendarDays size={18} />
          <strong>Date range</strong>
        </div>
        <label>
          From
          <input
            type="date"
            aria-label="From date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </label>
        <label>
          To
          <input
            type="date"
            aria-label="To date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </label>
        <ActionButton
          className="button secondary compact"
          pending={summary.isFetching || (!!memberId && events.isFetching)}
        >
          Apply filters
        </ActionButton>
        {(range.date_from || range.date_to) && (
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setFrom("");
              setTo("");
              setRange({ date_from: "", date_to: "" });
              setRangeError(undefined);
            }}
          >
            Clear
          </button>
        )}
        <span className="filter-scope">
          {range.date_from || range.date_to ? "Selected period" : "All time"} ·
          Europe/Paris
        </span>
      </form>
      <ErrorNotice error={rangeError} />
      <ErrorNotice error={summary.error} retry={() => void summary.refetch()} />
      {memberId ? (
        <>
          <Link className="back-link" to="/croissantage">
            <ArrowLeft size={16} />
            All team members
          </Link>
          <div className="section-heading member-heading">
            <div className="member-identity">
              <Avatar
                name={member?.display_name || "Team member"}
                url={member?.avatar_url}
                className="large"
              />
              <div>
                <h2>
                  {member?.display_name || member?.email || "Member history"}
                </h2>
                <p>{member?.email || memberId}</p>
              </div>
            </div>
            <span className="muted">
              {events.data?.total ?? "—"} recorded events
            </span>
          </div>
          {events.isPending ? (
            <Loading label="Loading attendance history…" />
          ) : events.isError ? (
            <ErrorNotice
              error={events.error}
              retry={() => void events.refetch()}
            />
          ) : events.data.items.length ? (
            <div className="event-list">
              {events.data.items.map((event) => (
                <div className="event-row" key={event.id}>
                  <div className={`event-symbol ${event.event_type}`}>
                    {event.event_type === "late" ? (
                      <Clock3 size={20} />
                    ) : (
                      <CalendarDays size={20} />
                    )}
                  </div>
                  <div>
                    <strong>
                      {event.event_type === "late" ? "Late arrival" : "Absence"}
                      {event.minutes_late ? ` · ${event.minutes_late} min` : ""}
                    </strong>
                    <p>{event.note || "No additional note"}</p>
                  </div>
                  <time dateTime={event.event_date}>
                    {calendarDate(event.event_date)}
                  </time>
                  {canManageAttendance && (
                    <div className="actions">
                      <button
                        className="icon-button"
                        aria-label={`Edit event on ${event.event_date}`}
                        onClick={() => setEditor(event)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="icon-button"
                        aria-label={`Delete event on ${event.event_date}`}
                        onClick={() => setRemove(event)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <Empty title="A clear record">
              No attendance events for this member
              {range.date_from || range.date_to
                ? " in the selected date range"
                : ""}
              . Members appear here even before their first sign-in.
            </Empty>
          )}
        </>
      ) : (
        <>
          <div className="section-heading">
            <div>
              <h2>The team</h2>
              <p>
                Active WorkStation members who have completed their first
                authorized sign-in.
              </p>
            </div>
          </div>
          {members.isPending ? (
            <Loading label="Loading team directory…" />
          ) : members.isError ? (
            <ErrorNotice
              error={members.error}
              retry={() => void members.refetch()}
            />
          ) : !rows.length ? (
            <Empty title="No active members available">
              Members appear here after their first authorized sign-in to
              WorkStation.
            </Empty>
          ) : (
            <div
              className="member-table"
              role="table"
              aria-label="Team attendance"
            >
              <div className="member-table-head" role="row">
                <span role="columnheader">TEAM MEMBER</span>
                <span role="columnheader">LATE ARRIVALS</span>
                <span role="columnheader">ABSENCES</span>
                <span role="columnheader">HISTORY</span>
              </div>
              {rows.map((m) => {
                const counts = aggregates.find((s) => s.member_id === m.id);
                return (
                  <div className="member-row" role="row" key={m.id}>
                    <div className="member-identity" role="cell">
                      <Avatar
                        name={m.display_name || m.email || "Member"}
                        url={m.avatar_url}
                      />
                      <div>
                        <strong>{m.display_name || "Team member"}</strong>
                        <small>{m.email || "Email unavailable"}</small>
                      </div>
                    </div>
                    <span
                      role="cell"
                      className={`attendance-number ${counts?.late_count ? "gold" : ""}`}
                    >
                      {summary.isError
                        ? "—"
                        : (counts?.late_count ?? (summary.isPending ? "…" : 0))}
                    </span>
                    <span
                      role="cell"
                      className={`attendance-number ${counts?.absence_count ? "blue" : ""}`}
                    >
                      {summary.isError
                        ? "—"
                        : (counts?.absence_count ??
                          (summary.isPending ? "…" : 0))}
                    </span>
                    <div role="cell">
                      <button
                        className="history-button"
                        aria-label={`View history for ${m.display_name || m.email || m.id}`}
                        onClick={() => navigate(`/croissantage/${m.id}`)}
                      >
                        View history
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
      <div className="directory-status">
        <UserRound size={16} />
        <div>
          <strong>WorkStation members</strong>
          <span>New members appear after their first authorized sign-in.</span>
        </div>
        <ActionButton
          className="text-button"
          pending={members.isFetching}
          onClick={() => {
            if (!members.isFetching)
              void client.invalidateQueries({ queryKey: ["members"] });
          }}
        >
          <RefreshCw size={14} />
          Refresh view
        </ActionButton>
      </div>
      {canManageAttendance && editor && (
        <EventEditor
          event={editor === "new" ? undefined : editor}
          members={rows}
          memberId={memberId}
          onClose={() => setEditor(undefined)}
        />
      )}{" "}
      {canManageAttendance && remove && (
        <Confirm
          title="Delete this attendance event?"
          description={`Remove the ${remove.event_type === "late" ? "late arrival" : "absence"} recorded on ${calendarDate(remove.event_date)}? The backend will update the totals.`}
          label="Delete event"
          onClose={() => setRemove(undefined)}
          onConfirm={async () => {
            await api.deleteEvent(remove.id);
            await client.invalidateQueries({ queryKey: ["attendance"] });
          }}
        />
      )}
    </section>
  );
}
