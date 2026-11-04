import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../menu_components/Menu.css";
import {
  postRoutine,
  getAllRoutines,
  renameRoutine,
  deleteRoutine,
} from "../api_components";

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

const ChevronIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const PencilIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m15 5 4 4M4 20l4.5-1 10.3-10.3a2.1 2.1 0 0 0-3-3L5.5 16 4 20Z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 7h16M10 11v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" />
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

// One routine row; its name opens the routine and the chevron opens its actions.
function RoutineCard({
  routine,
  onSelect,
  isActionsOpen,
  onToggleActions,
  onRename,
  onDelete,
}) {
  const actionsId = `routine-actions-${routine.id}`;

  return (
    <div className={`routines-card${isActionsOpen ? " is-open" : ""}`}>
      <div className={`routines-row${isActionsOpen ? " is-open" : ""}`}>
        <button
          type="button"
          className="routines-row-main"
          onClick={() => onSelect?.(routine)}
        >
          <span className="routines-row-name">{routine.name}</span>
        </button>
        <button
          type="button"
          className="routines-row-chevron"
          onClick={() => onToggleActions?.(routine)}
          aria-label={`${isActionsOpen ? "Close" : "Manage"} ${routine.name}`}
          aria-expanded={isActionsOpen}
          aria-controls={actionsId}
        >
          <ChevronIcon />
        </button>
      </div>

      {isActionsOpen && (
        <div className="routines-action-menu" id={actionsId} role="menu" aria-label={`${routine.name} actions`}>
          <button type="button" role="menuitem" className="routines-action-menu-item" onClick={() => onRename?.(routine)}>
            <PencilIcon />
            <span>Rename</span>
          </button>
          <div className="routines-action-menu-divider" />
          <button type="button" role="menuitem" className="routines-action-menu-item is-danger" onClick={() => onDelete?.(routine)}>
            <TrashIcon />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function RoutineMenu({ onCreate, onSelect }) {
  const [allRoutines, setAllRoutines] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeActionRoutineId, setActiveActionRoutineId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [routineToRename, setRoutineToRename] = useState(null);
  const [routineToDelete, setRoutineToDelete] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [isSavingAction, setIsSavingAction] = useState(false);
  const navigate = useNavigate();

  const { label, iso } = formatToday(useToday());

  const hasRoutines = allRoutines.length > 0;

  useEffect(() => {
    if (!actionNotice) return undefined;
    const timeoutId = window.setTimeout(() => setActionNotice(""), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [actionNotice]);

  useEffect(() => {
    if (!activeActionRoutineId && !routineToRename && !routineToDelete) return undefined;
    function closeActionsOnEscape(event) {
      if (event.key !== "Escape" || isSavingAction) return;
      setActiveActionRoutineId(null);
      setRoutineToRename(null);
      setRoutineToDelete(null);
      setActionError("");
    }
    document.addEventListener("keydown", closeActionsOnEscape);
    return () => document.removeEventListener("keydown", closeActionsOnEscape);
  }, [activeActionRoutineId, isSavingAction, routineToDelete, routineToRename]);

  useEffect(() => {
    if (!activeActionRoutineId) return undefined;

    function closeMenuWhenClickingOutside(event) {
      const clickedInsideMenu = event.target.closest?.(".routines-action-menu");
      const clickedOpenChevron = event.target.closest?.(
        '.routines-row-chevron[aria-expanded="true"]'
      );

      if (!clickedInsideMenu && !clickedOpenChevron) {
        setActiveActionRoutineId(null);
      }
    }

    document.addEventListener("pointerdown", closeMenuWhenClickingOutside);
    return () => document.removeEventListener("pointerdown", closeMenuWhenClickingOutside);
  }, [activeActionRoutineId]);

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

  function openForm() {
    onCreate?.();
    setIsFormOpen(true);
  }

  function handleSelectRoutine(routine) {
    onSelect?.(routine);
    navigate("/dashboard/", { state: { routine } });
  }

  function toggleRoutineActions(routine) {
    setActionError("");
    if (activeActionRoutineId === routine.id) {
      setActiveActionRoutineId(null);
      return;
    }
    setActiveActionRoutineId(routine.id);
    setRenameValue(routine.name ?? "");
  }

  function openRenameForm(routine) {
    setActiveActionRoutineId(null);
    setRoutineToRename(routine);
    setRenameValue(routine.name ?? "");
    setActionError("");
  }

  async function handleRenameRoutine(event) {
    event.preventDefault();
    const nextName = renameValue.trim();
    if (!nextName || !routineToRename) return;

    try {
      setIsSavingAction(true);
      setActionError("");
      await renameRoutine(routineToRename.id, nextName);
      setAllRoutines(await getAllRoutines());
      setRoutineToRename(null);
      setActionNotice("Routine renamed");
    } catch (error) {
      setActionError(error.message || "Could not rename this routine.");
    } finally {
      setIsSavingAction(false);
    }
  }

  async function handleDeleteRoutine() {
    if (!routineToDelete) return;

    try {
      setIsSavingAction(true);
      setActionError("");
      await deleteRoutine(routineToDelete.id);
      setAllRoutines(await getAllRoutines());
      setActiveActionRoutineId(null);
      setRoutineToDelete(null);
      setActionNotice("Routine deleted");
    } catch (error) {
      setActionError(error.message || "Could not delete this routine.");
    } finally {
      setIsSavingAction(false);
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

        {/* Split layout: title + button on the left, grouped list on the right */}
        <main className="routines-split">
          <div className="routines-side">
            <h1 id="routines-title">Your routines</h1>
            <CreateButton onCreate={openForm} />
          </div>

          {hasRoutines ? (
            <ul className="routines-group" aria-labelledby="routines-title">
              {allRoutines.map((routine) => (
                <li key={routine.id}>
                  <RoutineCard
                    routine={routine}
                    onSelect={handleSelectRoutine}
                    isActionsOpen={activeActionRoutineId === routine.id}
                    onToggleActions={toggleRoutineActions}
                    onRename={openRenameForm}
                    onDelete={(selectedRoutine) => {
                      setActiveActionRoutineId(null);
                      setActionError("");
                      setRoutineToDelete(selectedRoutine);
                    }}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="routines-empty">
              <div className="routines-empty-icon">
                <ListIcon />
              </div>

              <h2>No routines yet</h2>

              <p>Create your first routine and it will appear here.</p>
            </div>
          )}
        </main>

        {actionNotice && (
          <div className="routines-action-notice" role="status">
            <span aria-hidden="true">✓</span> {actionNotice}
          </div>
        )}

        {routineToDelete && (
          <div
            className="routine-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSavingAction) {
                setRoutineToDelete(null);
                setActionError("");
              }
            }}
          >
            <section
              className="routine-modal routine-delete-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="routine-delete-title"
              aria-describedby="routine-delete-copy"
            >
              <button
                type="button"
                className="routine-modal-close"
                onClick={() => {
                  setRoutineToDelete(null);
                  setActionError("");
                }}
                aria-label="Close delete form"
                disabled={isSavingAction}
              >
                &times;
              </button>
              <span className="routine-delete-mark" aria-hidden="true">!</span>
              <h2 id="routine-delete-title">Delete “{routineToDelete.name}”?</h2>
              <p id="routine-delete-copy">
                This routine will be removed from your list.
              </p>
              {actionError && <p className="routines-action-error" role="alert">{actionError}</p>}
              <div className="routine-modal-actions">
                <button
                  type="button"
                  className="routine-cancel"
                  onClick={() => {
                    setRoutineToDelete(null);
                    setActionError("");
                  }}
                  disabled={isSavingAction}
                >
                  Keep routine
                </button>
                <button
                  type="button"
                  className="routine-delete-confirm"
                  onClick={handleDeleteRoutine}
                  disabled={isSavingAction}
                >
                  {isSavingAction ? "Deleting…" : "Delete routine"}
                </button>
              </div>
            </section>
          </div>
        )}

        {routineToRename && (
          <div
            className="routine-modal-overlay"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isSavingAction) {
                setRoutineToRename(null);
                setActionError("");
              }
            }}
          >
            <section
              className="routine-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="routine-rename-title"
              aria-describedby="routine-rename-copy"
            >
              <button
                type="button"
                className="routine-modal-close"
                onClick={() => {
                  setRoutineToRename(null);
                  setActionError("");
                }}
                aria-label="Close rename form"
                disabled={isSavingAction}
              >
                &times;
              </button>
              <h2 id="routine-rename-title">Rename routine</h2>
              <p id="routine-rename-copy">Give “{routineToRename.name}” a new name.</p>
              <form className="routine-form" onSubmit={handleRenameRoutine}>
                <label htmlFor="routine-rename-name">Routine name</label>
                <input
                  id="routine-rename-name"
                  type="text"
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  maxLength={80}
                  autoFocus
                  required
                />
                {actionError && <p className="routines-action-error" role="alert">{actionError}</p>}
                <div className="routine-modal-actions">
                  <button
                    type="button"
                    className="routine-cancel"
                    onClick={() => {
                      setRoutineToRename(null);
                      setActionError("");
                    }}
                    disabled={isSavingAction}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="routine-submit"
                    disabled={isSavingAction || !renameValue.trim()}
                  >
                    {isSavingAction ? "Saving…" : "Save name"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}

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

                  <button type="submit" className="routine-submit">
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
