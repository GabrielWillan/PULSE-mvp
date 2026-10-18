import { useEffect, useState } from "react";
import "../menu_components/Menu.css";
import { postRoutine, getAllRoutines } from "../api_components";

function useToday() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    const id = setTimeout(
      () => setToday(new Date()),
      nextMidnight - now + 1000
    );

    return () => clearTimeout(id);
  }, [today]);

  return today;
}

function formatToday(date) {
  const weekday = date.toLocaleDateString("en-GB", {
    weekday: "long",
  });

  const dayMonth = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });

  const pad = (n) => String(n).padStart(2, "0");

  return {
    label: `${weekday}, ${dayMonth}`,
    iso: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}`,
  };
}

const ActivityIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 12h4l2.5-7 5 14L17 12h4" />
  </svg>
);

const ListIcon = () => (
  <svg
    width="26"
    height="26"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    aria-hidden="true"
  >
    <path d="M8 7h10M8 12h10M8 17h6M4.5 7h.01M4.5 12h.01M4.5 17h.01" />
  </svg>
);

function CreateButton({ onCreate }) {
  return (
    <button
      type="button"
      className="routines-create"
      onClick={() => onCreate?.()}
    >
      <span aria-hidden="true">+</span> Create routine
    </button>
  );
}

// Displays a routine returned by the backend.
function RoutineCard({ routine, onSelect }) {
  return (
    <button
      type="button"
      className="routines-card"
      onClick={() => onSelect?.(routine)}
    >
      <span className="routines-card-name">{routine.name}</span>
    </button>
  );
}

export function RoutineMenu({ onCreate, onSelect }) {
 const [allRoutines, setAllRoutines] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { label, iso } = formatToday(useToday());

  const hasRoutines = allRoutines.length > 0;

  // Fetch all routines when the component first loads.
  useEffect(() => {
    async function fetchRoutines() {
      try {
        const data = await getAllRoutines();

        console.log("Fetched routines:", data);

        setAllRoutines(data);
      } catch (error) {
        console.error("Failed to fetch routines:", error);
      }
    }

    fetchRoutines();
  }, []);

  // Create a routine and refresh the list.
  async function RoutineCreateHandler(event) {
    event.preventDefault();

    const title_name = event.target["routine-name"].value.trim();

    if (!title_name) {
      return;
    }

    try {
      await postRoutine(title_name);

      const updatedRoutines = await getAllRoutines();
      setAllRoutines(updatedRoutines);

      setIsFormOpen(false);
    } catch (error) {
      console.error("Failed to create routine:", error.message);
    }
  }

  return (
    <div className="routines">
      <div className="routines-inner">
        <header className="routines-hdr">
          <div className="routines-brand">
            <div className="routines-logo">
              <ActivityIcon />
            </div>

            <span className="routines-name">PULSE</span>
          </div>

          <time className="routines-date" dateTime={iso}>
            {label}
          </time>
        </header>

        <main
          className={
            "routines-glass" + (hasRoutines ? " has-items" : "")
          }
        >
          {hasRoutines ? (
            <>
              <div className="routines-head">
                <h1 id="routines-title">Your routines</h1>

                <CreateButton
                  onCreate={() => {
                    onCreate?.();
                    setIsFormOpen(true);
                  }}
                />
              </div>

              <ul
                className="routines-grid"
                aria-labelledby="routines-title"
              >
                {allRoutines.map((routine) => (
                  <li key={routine.id}>
                    <RoutineCard
                      routine={routine}
                      onSelect={onSelect}
                    />
                  </li>
                ))}
                </ul>
            </>
          ) : (
            <>
              <h1 id="routines-title">Your routines</h1>

              <div className="routines-empty">
                <div className="routines-empty-icon">
                  <ListIcon />
                </div>

                <h2>No routines yet</h2>

                <p>
                  Create your first routine and it will appear here.
                </p>

                <CreateButton
                  onCreate={() => {
                    onCreate?.();
                    setIsFormOpen(true);
                  }}
                />
              </div>
            </>
          )}
        </main>

        {/* Create routine modal */}
        {isFormOpen && (
          <div
            className="routine-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsFormOpen(false);
              }
            }}
          >
            <section
              className="routine-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="routine-modal-title"
            >
              <button
                type="button"
                className="routine-modal-close"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close form"
              >
                &times;
              </button>

              <h2 id="routine-modal-title">Create a routine</h2>

              <p>Build your training plan.</p>

              <form
                className="routine-form"
                onSubmit={RoutineCreateHandler}
              >
                <label htmlFor="routine-name">Routine name</label>

                <input
                  id="routine-name"
                  name="routine-name"
                  type="text"
                  placeholder="e.g. Push Pull Legs"
                  required
                />

                <div className="routine-modal-actions">
                  <button
                    type="button"
                    className="routine-cancel"
                    onClick={() => setIsFormOpen(false)}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="routine-submit"
                  >
                    Create routine
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}