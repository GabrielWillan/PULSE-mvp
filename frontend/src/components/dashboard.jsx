import { useState } from "react";

const Icon = ({ size = 20, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const Menu = (p) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
const Activity = (p) => <Icon {...p}><path d="M3 12h4l2.5-7 5 14L17 12h4" /></Icon>;
const Plus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
const ArrowRight = (p) => <Icon {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Icon>;
const Check = (p) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;

const days = [
  { label: "Day 1", title: "Upper body strength", sub: "Chest, shoulders and back · 45 min" },
  { label: "Day 2", title: "Conditioning", sub: "Intervals and core · 35 min" },
  { label: "Day 3", title: "Lower body hypertrophy", sub: "Quads, hamstrings and glutes · 50 min" },
  { label: "Day 4", title: "Upper body push", sub: "Chest, shoulders and triceps · 45 min" },
  { label: "Day 5", title: "Lower body strength", sub: "Squat, hinge and calves · 52 min" },
  { label: "Day 6", title: "Upper body pull", sub: "Back and biceps · 40 min" },
  { label: "Day 7", title: "Mobility", sub: "Stretching and breathwork · 25 min" },
];

const GOAL = 5;
const LAST_SESSION = { index: 4, when: "Friday · Day 5", stats: "7 exercises · 52 minutes · 36 sets" };

// onMenu / onAdd / onViewDay are optional hooks for your router or API calls
export function Dashboard({ onMenu, onAdd, onViewDay }) {
  const [selected, setSelected] = useState(0);
  const [done, setDone] = useState(() => new Set([1, 2, 3, 4]));

  const day = days[selected];
  const isDone = done.has(selected);
  const count = done.size;
  const remaining = Math.max(GOAL - count, 0);
  const sessionWord = count === 1 ? "session" : "sessions";

  const toggleDone = () =>
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(selected)) next.delete(selected);
      else next.add(selected);
      return next;
    });

  const note =
    remaining === 0
      ? "Goal reached."
      : remaining === 1
      ? "One more to reach your goal."
      : `${remaining} more to reach your goal.`;

  return (
    <div className="pulse-root">
      <div className="pulse-frame">
        <header className="pulse-hdr">
          <div className="pulse-hl">
            <div className="pulse-logo">
              <Activity size={20} />
            </div>
            <div className="pulse-brand">PULSE</div>
          </div>
          <div className="pulse-hr">
            <button className="pulse-date" aria-label="Jump to today" onClick={() => setSelected(0)}>
              Sunday, 11 October
            </button>
            <button className="pulse-plus" aria-label="Add session" onClick={() => onAdd?.()}>
              <Plus size={22} />
            </button>
          </div>
        </header>

        <section className="pulse-hero">
          <div className="pulse-eyebrow">YOUR TRAINING CALENDAR</div>
          <h1>Good morning</h1>
          <p>A quick look at your week and what's next.</p>
        </section>

        <section className="pulse-week" aria-label="Week 41">
          <div className="pulse-week-h">
            <b>Week 41</b>
            <span>{count} {sessionWord} completed</span>
          </div>
          <div className="pulse-days" role="tablist">
            {days.map((d, i) => (
              <button
                key={d.label}
                role="tab"
                aria-selected={i === selected}
                aria-label={done.has(i) ? `${d.label}, completed` : d.label}
                className={"pulse-day" + (i === selected ? " sel" : "") + (done.has(i) ? " done" : "")}
                onClick={() => setSelected(i)}
              >
                {d.label}
                <i />
              </button>
            ))}
          </div>
        </section>

        <div className="pulse-cols">
          <div className="pulse-stack">
            <div className="pulse-card pulse-sel">
              <div className="pulse-eyebrow">SELECTED · {day.label.toUpperCase()}</div>
              <h2>{day.title}</h2>
              <p>{day.sub}</p>
              <div className="pulse-actions">
                <button className="pulse-btn" onClick={() => onViewDay?.(day, selected)}>
                  View day <ArrowRight size={18} />
                </button>
                <button
                  className={"pulse-btn ghost" + (isDone ? " on" : "")}
                  aria-pressed={isDone}
                  onClick={toggleDone}
                >
                  {isDone ? (<><Check size={18} /> Completed</>) : "Mark complete"}
                </button>
              </div>
            </div>

            <button
              className="pulse-card pulse-last"
              onClick={() => setSelected(LAST_SESSION.index)}
            >
              <span className="pulse-last-h">
                <span className="pulse-last-title">Last session</span>
                <span>{LAST_SESSION.when}</span>
              </span>
              <span className="pulse-last-t">{days[LAST_SESSION.index].title}</span>
              <span className="pulse-last-s">{LAST_SESSION.stats}</span>
            </button>
          </div>

          <div className="pulse-card pulse-aside">
            <h3>Week at a glance</h3>
            <div className="pulse-big">
              <b>{count}</b>
              <span>
                {sessionWord}
                <br />
                completed
              </span>
            </div>
            <div className="pulse-aside-foot">
              <div className="pulse-track">
                <i style={{ width: `${Math.min(100, (count / GOAL) * 100)}%` }} />
              </div>
              <small className="pulse-note">{note}</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}