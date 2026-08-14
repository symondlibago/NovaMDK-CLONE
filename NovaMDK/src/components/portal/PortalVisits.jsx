import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { AlertCircle, ChevronLeft, ChevronRight, FileText, Pill, Stethoscope, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { portalData } from "../../lib/portal";

const STATUS = {
  new: { label: "Submitted", tone: "muted" },
  pending: { label: "Submitted", tone: "muted" },
  assigned: { label: "With your clinician", tone: "active" },
  processing: { label: "In review", tone: "active" },
  prescribed: { label: "Treatment prescribed", tone: "done" },
  completed: { label: "Complete", tone: "done" },
  closed: { label: "Complete", tone: "done" },
  cancelled: { label: "Cancelled", tone: "muted" },
  canceled: { label: "Cancelled", tone: "muted" },
};

const titleCase = (s) => String(s || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function StatusPill({ status }) {
  if (!status) return null;
  const { label, tone } = STATUS[status] || { label: titleCase(status), tone: "muted" };
  const tones = {
    active: "border-primary/30 bg-primary/10 text-primary",
    done: "border-line-strong bg-surface-2 text-ink",
    muted: "border-line bg-surface-2 text-muted",
  };
  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[0.72rem] font-semibold ${tones[tone]}`}>
      {label}
    </span>
  );
}

/* Steps 1-3 come from the case status history; 4-5 from the pharmacy order.
   MDI has no delivered state, so the last step is Shipped. */
function Stepper({ timeline }) {
  if (!timeline) return null;

  if (timeline.cancelled_at) {
    return (
      <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-[0.9rem] text-muted">
        This visit was cancelled on {format(new Date(timeline.cancelled_at), "MMMM d, yyyy")}.
      </p>
    );
  }

  return (
    <>
      <ol className="flex gap-1">
        {timeline.steps.map((s) => (
          <li key={s.key} className="flex-1">
            {/* The bar carries the state; the dot-and-line version breaks up badly
                at narrow widths where five labels have to share the row. */}
            <div
              className={`h-1.5 rounded-full ${
                s.done ? "bg-primary" : s.current ? "bg-primary/45" : "bg-line"
              }`}
            />
            <p
              className={`mt-2 text-[0.7rem] leading-tight sm:text-[0.78rem] ${
                s.done || s.current ? "font-semibold text-ink" : "text-muted"
              }`}
            >
              {s.label}
            </p>
            <p className="mt-0.5 text-[0.66rem] text-muted sm:text-[0.7rem]">
              {s.at ? format(new Date(s.at), "MMM d") : " "}
            </p>
          </li>
        ))}
      </ol>

      {/* MDI stops at "shipped", so the carrier link is the patient's only route
          to a delivery date. */}
      {timeline.tracking && (
        <p className="mt-4 flex flex-wrap items-center gap-1.5 text-[0.85rem] text-muted">
          <Truck size={14} className="shrink-0 text-primary" />
          Tracking
          {timeline.tracking.company && <> · {timeline.tracking.company}</>}
          {timeline.tracking.link ? (
            <a href={timeline.tracking.link} target="_blank" rel="noopener noreferrer"
              className="font-mono font-medium text-primary underline-offset-4 hover:underline">
              {timeline.tracking.number}
            </a>
          ) : (
            <span className="font-mono font-medium text-ink">{timeline.tracking.number}</span>
          )}
        </p>
      )}

      {timeline.issue && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[0.85rem] leading-relaxed text-ink">
          <AlertCircle size={15} className="mt-0.5 shrink-0 text-primary" />
          <span>
            The pharmacy couldn't process this order: {timeline.issue} Please{" "}
            <Link to="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
              contact support
            </Link>{" "}
            so we can get it moving.
          </span>
        </p>
      )}
    </>
  );
}

const Bar = ({ className }) => (
  <span className={`block animate-pulse rounded-full bg-line ${className}`} />
);

function StepperSkeleton() {
  return (
    <ol className="flex gap-1" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <li key={i} className="flex-1">
          <Bar className="h-1.5 w-full" />
          <Bar className="mt-2.5 h-2.5 w-4/5" />
          <Bar className="mt-1.5 h-2 w-1/2" />
        </li>
      ))}
    </ol>
  );
}

function DoctorSkeleton() {
  return (
    <div aria-hidden="true">
      <Bar className="mb-3 h-4 w-36" />
      <div className="flex gap-4 rounded-xl border border-line bg-bg p-4">
        <span className="h-14 w-14 shrink-0 animate-pulse rounded-full bg-line" />
        <div className="min-w-0 flex-1 space-y-2">
          <Bar className="h-3.5 w-44" />
          <Bar className="h-3 w-64 max-w-full" />
          <Bar className="mt-3 h-3 w-full" />
          <Bar className="h-3 w-11/12" />
          <Bar className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

function DoctorCard({ clinician }) {
  if (!clinician) return null;
  return (
    <div className="flex gap-4 rounded-xl border border-line bg-bg p-4">
      {clinician.photo ? (
        <img
          src={clinician.photo}
          alt=""
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
          <Stethoscope size={20} />
        </span>
      )}
      <div className="min-w-0">
        <p className="text-[0.95rem] font-semibold text-ink">
          Dr. {clinician.name}
          {clinician.suffix && <span className="font-normal text-muted"> {clinician.suffix}</span>}
        </p>
        {clinician.specialty && (
          <p className="mt-0.5 text-[0.82rem] leading-relaxed text-muted">{clinician.specialty}</p>
        )}
        {clinician.bio && (
          <p className="mt-2 text-[0.85rem] leading-relaxed text-muted">{clinician.bio}</p>
        )}
      </div>
    </div>
  );
}

function Treatments({ treatments }) {
  if (!treatments.length) {
    return (
      <p className="text-[0.92rem] text-muted">
        No treatment prescribed yet. Your clinician will post here once they've
        reviewed your intake.
      </p>
    );
  }
  return (
    <ul className="space-y-2.5">
      {treatments.map((t) => (
        <li key={t.id} className="flex gap-3 rounded-xl border border-line bg-bg p-3.5">
          <Pill size={16} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-[0.92rem] font-semibold text-ink">{t.name}</p>
            {t.detail && <p className="mt-0.5 text-[0.85rem] leading-relaxed text-muted">{t.detail}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function PortalVisits({ onUnauthorized }) {
  const [cases, setCases] = useState(null);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);
  // Keyed by case id so reopening a visit doesn't refetch it.
  const [details, setDetails] = useState({});

  useEffect(() => {
    portalData({ resource: "cases" })
      .then(({ cases: next }) => setCases(next))
      .catch((err) => {
        if (err.status === 401) return onUnauthorized();
        setError(err.message);
      });
  }, [onUnauthorized]);

  // The stepper and clinician cost three upstream calls, so they're fetched
  // when a visit is opened rather than for every row in the list.
  useEffect(() => {
    if (!openId || details[openId]) return;
    portalData({ resource: "case_detail", case_id: openId })
      .then((d) => setDetails((prev) => ({ ...prev, [openId]: d })))
      .catch((err) => {
        if (err.status === 401) return onUnauthorized();
        setError(err.message);
      });
  }, [openId, details, onUnauthorized]);

  const shell = "nv-scroll min-h-0 flex-1 overflow-y-auto px-5 py-8";

  if (error) {
    return (
      <div className={shell} data-lenis-prevent>
        <p role="alert" className="mx-auto flex max-w-3xl items-center gap-2 text-[0.9rem] text-ink">
          <AlertCircle size={15} className="text-primary" /> {error}
        </p>
      </div>
    );
  }

  if (cases === null) {
    return (
      <div className={shell} data-lenis-prevent aria-busy="true">
        <div className="mx-auto max-w-3xl">
          <Bar className="h-6 w-40" />
          <Bar className="mt-3 h-3.5 w-72 max-w-full" />
          <ul className="mt-6 space-y-3">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 sm:p-5">
                <span className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-line" />
                <span className="min-w-0 flex-1">
                  <Bar className="h-3.5 w-28" />
                  <Bar className="mt-2 h-3 w-64 max-w-full" />
                </span>
              </li>
            ))}
          </ul>
          <span className="sr-only">Loading your visits</span>
        </div>
      </div>
    );
  }

  const open = cases.find((c) => c.case_id === openId);
  const detail = open ? details[open.case_id] : null;

  if (open) {
    return (
      <div className={shell} data-lenis-prevent>
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => setOpenId(null)}
            className="mb-5 flex items-center gap-1 text-[0.88rem] font-medium text-muted transition-colors hover:text-ink"
          >
            <ChevronLeft size={16} /> All visits
          </button>

          <div className="rounded-2xl border border-line bg-surface p-6 nv-shadow sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-[1.45rem] leading-tight text-ink">Visit #{open.number}</h1>
                <p className="mt-1 text-[0.9rem] text-muted">
                  {format(new Date(open.created_at), "MMMM d, yyyy")}
                  {open.clinician && <> · Dr. {open.clinician}</>}
                </p>
              </div>
              <StatusPill status={open.status} />
            </div>

            <div className="mt-6" aria-busy={!detail}>
              {detail ? <Stepper timeline={detail.timeline} /> : <StepperSkeleton />}
            </div>

            <hr className="my-6 border-line" />

            <h2 className="mb-3 text-[1.05rem] text-ink">Requested treatment</h2>
            <Treatments treatments={open.treatments} />

            {/* While loading, the skeleton stands in. Once loaded, the section
                disappears entirely if no clinician is assigned yet. */}
            {!detail ? (
              <>
                <hr className="my-6 border-line" />
                <DoctorSkeleton />
                <span className="sr-only">Loading visit details</span>
              </>
            ) : (
              detail.clinician && (
                <>
                  <hr className="my-6 border-line" />
                  <h2 className="mb-3 text-[1.05rem] text-ink">Meet your doctor</h2>
                  <DoctorCard clinician={detail.clinician} />
                </>
              )
            )}

            <hr className="my-6 border-line" />

            <p className="text-[0.88rem] leading-relaxed text-muted">
              Questions about your treatment? Message your care team from the{" "}
              <span className="font-medium text-ink">Messages</span> tab. For orders,
              shipping or billing,{" "}
              <Link to="/contact" className="font-medium text-primary underline-offset-4 hover:underline">
                contact support
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell} data-lenis-prevent>
      <div className="mx-auto max-w-3xl">
        <h1 className="text-[1.45rem] leading-tight text-ink">Your visits</h1>
        <p className="mt-1 text-[0.9rem] text-muted">
          Every consultation you've submitted, newest first.
        </p>

        {cases.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-line bg-surface p-10 text-center nv-shadow">
            <FileText size={26} className="mx-auto text-primary" />
            <p className="mt-3 text-[1.05rem] font-semibold text-ink">No visits yet</p>
            <p className="mx-auto mt-1.5 max-w-sm text-[0.9rem] leading-relaxed text-muted">
              Once you complete an intake, your consultation will appear here.
            </p>
            <Link
              to="/treatments"
              className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-[0.9rem] font-semibold text-on-primary transition-colors hover:bg-primary-deep"
            >
              Browse treatments
            </Link>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {[...cases].reverse().map((c) => (
              <li key={c.case_id}>
                <button
                  onClick={() => setOpenId(c.case_id)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-primary sm:p-5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-primary">
                    <FileText size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                      <span className="text-[1rem] font-semibold text-ink">Visit #{c.number}</span>
                      <StatusPill status={c.status} />
                    </span>
                    <span className="mt-1 block truncate text-[0.85rem] text-muted">
                      {format(new Date(c.created_at), "MMM d, yyyy")}
                      {c.clinician && <> · Dr. {c.clinician}</>}
                      {" · "}
                      {c.treatments.length
                        ? `${c.treatments.length} treatment${c.treatments.length > 1 ? "s" : ""}`
                        : "No treatment prescribed"}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-muted transition-colors group-hover:text-primary" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
