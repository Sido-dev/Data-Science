import React, { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Download,
  Github,
  LayoutDashboard,
  Map,
  Search,
  Settings,
  Target,
  X,
  Briefcase,
  Clock,
  SlidersHorizontal,
  Cloud,
} from "lucide-react";
import {
  bundled,
  useWorkspace,
  trackModules,
  nextModule,
  record,
  download,
  validState,
  validContent,
} from "./state";
import { request, syncEnabled } from "./api";
const trackName = (t) => (t === "analyst" ? "Data Analyst" : "Data Scientist");
const dateLabel = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
function Action({ to, children, secondary = false, ...props }) {
  const cls = `button ${secondary ? "secondary" : "primary"}`;
  return to ? (
    <Link className={cls} to={to} {...props}>
      {children}
    </Link>
  ) : (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
function Tag({ children }) {
  return <span className="tag">{children}</span>;
}
function Empty({ children }) {
  return (
    <div className="empty">
      <BookOpen size={28} />
      <p>{children}</p>
    </div>
  );
}
function Progress({ value, label }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin="0"
      aria-valuemax="100"
      aria-valuenow={Math.round(value)}
    >
      <span style={{ width: `${value}%` }} />
    </div>
  );
}
function Dialog({ title, children, close }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    el.showModal();
    return () => el.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={close}
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="dialog-head">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={close}
        >
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
function PlanForm({ profile, save, close }) {
  const [draft, setDraft] = useState(profile);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({ ...draft, onboarded: true });
        close();
      }}
      className="form-stack"
    >
      <p className="muted">
        A realistic plan starts with the time you actually have. You can change
        these choices whenever you like.
      </p>
      <label>
        What should we call you?
        <input
          maxLength={80}
          placeholder="Your first name (optional)"
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
        />
      </label>
      <fieldset>
        <legend>Your direction</legend>
        <div className="choice-grid">
          {["analyst", "scientist"].map((t) => (
            <label
              className={`choice ${draft.track === t ? "selected" : ""}`}
              key={t}
            >
              <input
                type="radio"
                name="track"
                checked={draft.track === t}
                onChange={() => setDraft({ ...draft, track: t })}
              />
              <strong>{trackName(t)}</strong>
              <span>
                {t === "analyst"
                  ? "SQL, dashboards & business decisions"
                  : "Python, experiments & machine learning"}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        Experience
        <select
          value={draft.level}
          onChange={(e) => setDraft({ ...draft, level: e.target.value })}
        >
          <option value="beginner">Starting from the foundations</option>
          <option value="some">Some experience — ready to practise</option>
        </select>
      </label>
      <label>
        Study time each week
        <select
          value={draft.hours}
          onChange={(e) =>
            setDraft({ ...draft, hours: Number(e.target.value) })
          }
        >
          <option value={3}>3 hours · steady pace</option>
          <option value={5}>5 hours · a little most days</option>
          <option value={10}>10 hours · focused study</option>
        </select>
      </label>
      <Action type="submit">
        Save my plan <ArrowRight size={17} />
      </Action>
    </form>
  );
}
function Dashboard({ state, content, onPlan }) {
  const modules = trackModules(content, state.profile.track),
    done = modules.filter((m) => state.completed[m.id]).length;
  const next = nextModule(modules, state.completed),
    hours = modules
      .filter((m) => !state.completed[m.id])
      .reduce((a, m) => a + m.hours, 0);
  const answers = content.questions
    .filter((q) => state.answers[q.id])
    .map((q) => state.answers[q.id]);
  const weekActivity = state.activity.filter(
    (a) => Date.now() - new Date(a.at).getTime() < 7 * 86400000,
  );
  const queue = modules.filter((m) => !state.completed[m.id]);
  const practiceFirst =
    state.profile.onboarded &&
    state.profile.level === "some" &&
    answers.length === 0;
  const weekly = [];
  let budget = state.profile.hours;
  for (const m of queue) {
    if (budget <= 0) break;
    const allocation = Math.min(m.hours, budget);
    weekly.push({ m, allocation });
    budget -= allocation;
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR LEARNING DESK</p>
          <h1>
            {state.profile.name
              ? `Welcome back, ${state.profile.name}.`
              : "Make time for your next step."}
          </h1>
          <p className="muted">
            A clear direction. A little practice. Something to show for it.
          </p>
        </div>
        <button className="text-button" onClick={onPlan}>
          <SlidersHorizontal size={16} /> Edit your plan
        </button>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            {state.profile.onboarded
              ? `${trackName(state.profile.track).toUpperCase()} · YOUR NEXT CHAPTER`
              : "LESS SCROLLING. MORE LEARNING."}
          </span>
          <h2>
            {state.profile.onboarded ? (
              next ? (
                next.title
              ) : (
                "You followed through."
              )
            ) : (
              <>
                Turn curiosity
                <br />
                into capability.
              </>
            )}
          </h2>
          <p>
            {state.profile.onboarded
              ? next
                ? next.summary
                : "Your roadmap is complete. Put your skills to work in a portfolio project, then review the concepts you found difficult."
              : "Build practical data skills with a plan that fits your week. Learn the idea, try it yourself, and keep the evidence."}
          </p>
          <div className="hero-actions">
            {!state.profile.onboarded ? (
              <Action onClick={onPlan}>
                Build my study plan <ArrowRight size={18} />
              </Action>
            ) : (
              <Action
                to={
                  practiceFirst
                    ? "/practice"
                    : next
                      ? `/roadmap?topic=${next.id}`
                      : "/projects"
                }
              >
                {practiceFirst
                  ? "Check my foundations"
                  : next
                    ? "Continue learning"
                    : "Explore projects"}{" "}
                <ArrowRight size={18} />
              </Action>
            )}
            <Link className="quiet-link" to="/roadmap">
              Explore the roadmap <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="hero-foot">
            <span className="tiny-dot" /> Free to explore <span>·</span>{" "}
            Progress saved on this browser
          </div>
        </div>
        <div className="desk-art" aria-hidden="true">
          <div className="art-grid" />
          <div className="art-note">
            <span>THE LEARNING LOOP</span>
            <div className="note-line">
              <i>01</i> Understand
            </div>
            <div className="note-line">
              <i>02</i> Experiment
            </div>
            <div className="note-line">
              <i>03</i> Build something.
            </div>
            <div className="note-rule" />
            <small>Small steps. Real progress.</small>
          </div>
          <div className="art-stamp">
            LEARN
            <br />
            BY DOING
            <ArrowUpRight size={22} />
          </div>
        </div>
      </section>
      <div className="stats-row">
        <div>
          <span>Roadmap progress</span>
          <strong>
            {done}
            <small> / {modules.length} topics</small>
          </strong>
          <Progress
            value={(done / modules.length) * 100}
            label="Roadmap completion"
          />
        </div>
        <div>
          <span>Knowledge checks</span>
          <strong>
            {answers.filter((a) => a.correct).length}
            <small> / {content.questions.length} correct</small>
          </strong>
          <p>
            {answers.length} attempted · {content.questions.length - answers.length} remaining
          </p>
        </div>
        <div>
          <span>Your weekly commitment</span>
          <strong>
            {state.profile.hours}
            <small> hours / week</small>
          </strong>
          <p>
            About {Math.ceil(hours / state.profile.hours)} weeks of topics
            remaining
          </p>
        </div>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">ONE WEEK AT A TIME</p>
              <h2>Your study shortlist</h2>
            </div>
            <Tag>{state.profile.hours}h budget</Tag>
          </div>
          <p className="muted small">
            Suggested allocation. Topic estimates cover reading and practice;
            projects take additional time.
          </p>
          {weekly.length ? (
            weekly.map(({ m, allocation }, i) => (
              <Link
                to={`/roadmap?topic=${m.id}`}
                className="study-row"
                key={m.id}
              >
                <span className="row-number">0{i + 1}</span>
                <div>
                  <strong>{m.title}</strong>
                  <span>
                    {m.phase} · {allocation}h this week
                    {allocation < m.hours ? " · continue next week" : ""}
                  </span>
                </div>
                <ArrowUpRight size={18} />
              </Link>
            ))
          ) : (
            <Empty>
              Topics complete. Choose a project to apply what you know.
            </Empty>
          )}
        </section>
        <section className="panel review-panel">
          <p className="eyebrow">YOUR WEEKLY REVIEW</p>
          <h2>Leave a trail of progress.</h2>
          <p>
            {weekActivity.length
              ? `${weekActivity.length} learning actions recorded over the last 7 days.`
              : "Start one topic or answer one question. Your activity will appear here as you go."}
          </p>
          <div
            className="week-bars"
            aria-label="Learning activity for the last seven days"
          >
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - 6 + i);
              const count = weekActivity.filter(
                (a) => new Date(a.at).toDateString() === d.toDateString(),
              ).length;
              return (
                <div
                  key={i}
                  title={`${d.toLocaleDateString()}: ${count} actions`}
                >
                  <span
                    style={{
                      height: Math.min(64, 5 + count * 12),
                      background: count ? "var(--green)" : "var(--line)",
                    }}
                  />
                  <small>
                    {d.toLocaleDateString(undefined, { weekday: "narrow" })}
                  </small>
                </div>
              );
            })}
          </div>
          <Link className="quiet-link" to="/progress">
            View your learning record <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <section className="project-strip">
        <div className="strip-icon">
          <Briefcase size={24} />
        </div>
        <div>
          <p className="eyebrow">MAKE IT TANGIBLE</p>
          <h3>Your next portfolio piece starts here.</h3>
          <p>
            Real datasets. Clear milestones. Work you can explain in an
            interview.
          </p>
        </div>
        <Action secondary to="/projects">
          Find a project <ArrowUpRight size={17} />
        </Action>
      </section>
    </>
  );
}
function Roadmap({ state, update, content, onPlan }) {
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const location = useLocation();
  const selectedId = new URLSearchParams(location.search).get("topic");
  const [selected, setSelected] = useState(null);
  const closeTopic = () => {
    setSelected(null);
    if (selectedId) navigate("/roadmap", { replace: true });
  };
  useEffect(() => {
    if (selectedId)
      setSelected(content.modules.find((m) => m.id === selectedId) || null);
  }, [selectedId, content]);
  const modules = trackModules(content, state.profile.track),
    done = modules.filter((m) => state.completed[m.id]).length;
  const filtered = modules.filter(
    (m) =>
      (m.title + " " + m.summary)
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "done" ? state.completed[m.id] : !state.completed[m.id])),
  );
  function toggle(m) {
    update((s) => {
      const completed = { ...s.completed };
      if (completed[m.id]) delete completed[m.id];
      else completed[m.id] = new Date().toISOString();
      return {
        ...s,
        completed,
        activity: record(
          s,
          `${completed[m.id] ? "Completed" : "Reopened"} ${m.title}`,
        ),
      };
    });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">THE PATH, MADE PRACTICAL</p>
          <h1>Your {trackName(state.profile.track).toLowerCase()} roadmap.</h1>
          <p className="muted">
            Understand the foundations. Practise deliberately. Build your own
            evidence.
          </p>
        </div>
        <button className="text-button" onClick={onPlan}>
          Change track <SlidersHorizontal size={16} />
        </button>
      </div>
      <div className="roadmap-summary">
        <div>
          <strong>
            {done} of {modules.length} topics complete
          </strong>
          <span>Follow the suggested order, or open any topic to explore.</span>
        </div>
        <Progress
          value={(done / modules.length) * 100}
          label="Track completion"
        />
      </div>
      <div className="toolbar">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Search topics"
            placeholder="Find a topic, skill or concept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="segmented" aria-label="Filter topics">
          {[
            ["all", "All topics"],
            ["todo", "To learn"],
            ["done", "Completed"],
          ].map(([id, label]) => (
            <button
              key={id}
              aria-pressed={filter === id}
              className={filter === id ? "active" : ""}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="roadmap-list">
        {filtered.length ? (
          [...new Set(filtered.map((m) => m.phase))].map((phase) => (
            <section className="phase" key={phase}>
              <div className="phase-label">
                <span className="phase-dot" />
                <h2>{phase}</h2>
                <span>
                  {filtered.filter((m) => m.phase === phase).length} topics
                </span>
              </div>
              {filtered
                .filter((m) => m.phase === phase)
                .map((m) => (
                  <button
                    className={`topic-row ${state.completed[m.id] ? "done" : ""}`}
                    onClick={() => setSelected(m)}
                    key={m.id}
                  >
                    <span className="topic-status">
                      {state.completed[m.id] ? (
                        <Check size={18} />
                      ) : (
                        String(modules.indexOf(m) + 1).padStart(2, "0")
                      )}
                    </span>
                    <span className="topic-copy">
                      <strong>{m.title}</strong>
                      <span>{m.summary}</span>
                      <small>
                        {m.requires.length
                          ? `Recommended first: ${m.requires.map((id) => content.modules.find((x) => x.id === id)?.title).join(", ")}`
                          : "No prerequisites · start here"}
                      </small>
                    </span>
                    <span className="topic-time">
                      <Clock size={14} />
                      {m.hours}h
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
            </section>
          ))
        ) : (
          <Empty>No matching topics. Try a different search or filter.</Empty>
        )}
      </div>
      {selected && (
        <Dialog title={selected.title} close={closeTopic}>
          <div className="topic-meta">
            <Tag>{selected.phase}</Tag>
            <span>{selected.hours}h estimated study</span>
          </div>
          <p className="lead">{selected.summary}</p>
          <h3>The idea</h3>
          {selected.lesson.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <h3>Try it yourself</h3>
          <ol className="task-list">
            {selected.tasks.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ol>
          <h3>Go deeper</h3>
          {selected.resources.map((r) => (
            <a
              className="resource-link"
              key={r.url}
              href={r.url}
              target="_blank"
              rel="noreferrer"
            >
              {r.label}
              <ArrowUpRight size={17} />
            </a>
          ))}
          <label className="notes-label">
            Your notes
            <textarea
              maxLength={20000}
              placeholder="What did you learn? What do you want to revisit?"
              value={state.notes[selected.id] || ""}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  notes: { ...s.notes, [selected.id]: e.target.value },
                }))
              }
            />
          </label>
          <p className="small muted">
            Notes save automatically to this browser. Mark complete after trying
            the tasks.
          </p>
          <div className="dialog-actions">
            <Action onClick={() => toggle(selected)}>
              {state.completed[selected.id]
                ? "Reopen topic"
                : "Mark topic complete"}
              <Check size={16} />
            </Action>
            <Action
              secondary
              to={`/practice?module=${selected.id}`}
              onClick={() => setSelected(null)}
            >
              Practise this topic
            </Action>
          </div>
        </Dialog>
      )}
    </>
  );
}
function Practice({ state, update, content }) {
  const location = useLocation();
  const initial = new URLSearchParams(location.search).get("module") || "all";
  const [topic, setTopic] = useState(initial),
    [mode, setMode] = useState("questions"),
    [review, setReview] = useState(false),
    [revealed, setRevealed] = useState({});
  const questions = content.questions.filter(
    (q) =>
      (topic === "all" || q.module === topic) &&
      (!review || (state.answers[q.id] && !state.answers[q.id].correct)),
  );
  function answer(q, choice) {
    if (state.answers[q.id]) return;
    update((s) => ({
      ...s,
      answers: {
        ...s.answers,
        [q.id]: { choice, correct: choice === q.answer },
      },
      activity: record(s, `Practised: ${q.prompt}`),
    }));
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">LEARNING HAPPENS IN THE DOING</p>
          <h1>Test the idea. Keep the lesson.</h1>
          <p className="muted">
            Short knowledge checks and practical prompts, with explanations that
            help you improve.
          </p>
        </div>
        <Tag>{content.questions.length} knowledge checks</Tag>
      </div>
      <div className="toolbar">
        <div className="segmented">
          <button
            className={mode === "questions" ? "active" : ""}
            onClick={() => setMode("questions")}
          >
            Knowledge checks
          </button>
          <button
            className={mode === "code" ? "active" : ""}
            onClick={() => setMode("code")}
          >
            SQL & Python
          </button>
        </div>
        {mode === "questions" && (
          <div className="practice-filters">
            <select
              aria-label="Practice topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            >
              <option value="all">All topics</option>
              {content.modules.map((m) => (
                <option value={m.id} key={m.id}>
                  {m.title}
                </option>
              ))}
            </select>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={review}
                onChange={(e) => setReview(e.target.checked)}
              />
              Review mistakes
            </label>
          </div>
        )}
      </div>
      {mode === "questions" ? (
        <div className="question-grid">
          {questions.length ? (
            questions.map((q) => {
              const a = state.answers[q.id];
              return (
                <section className="question-card" key={q.id}>
                  <p className="eyebrow">
                    {content.modules.find((m) => m.id === q.module)?.title}
                  </p>
                  <h2>{q.prompt}</h2>
                  <div className="answers">
                    {q.options.map((o, i) => (
                      <button
                        key={i}
                        disabled={Boolean(a)}
                        className={`${a && i === q.answer ? "correct" : ""} ${a && i === a.choice && !a.correct ? "incorrect" : ""}`}
                        onClick={() => answer(q, i)}
                      >
                        <span>{String.fromCharCode(65 + i)}</span>
                        {o}
                        {a && i === q.answer && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                  {a && (
                    <div
                      className={`explanation ${a.correct ? "" : "retry"}`}
                      role="status"
                    >
                      <strong>
                        {a.correct
                          ? "You’ve got it."
                          : "A useful one to revisit."}
                      </strong>
                      <p>{q.explanation}</p>
                      <button
                        className="text-button"
                        onClick={() =>
                          update((s) => {
                            const answers = { ...s.answers };
                            delete answers[q.id];
                            return { ...s, answers };
                          })
                        }
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <Empty>
              {review
                ? "No mistakes to review in this selection."
                : "No knowledge checks for this topic yet. Try the hands-on tasks in the roadmap."}
            </Empty>
          )}
        </div>
      ) : (
        <>
          <div className="notice">
            <Code2 size={20} />
            <span>
              This is a practice notebook, not a code runner. Write a solution,
              run it in your own Python or SQL environment, then compare with
              the worked example.
            </span>
          </div>
          <div className="exercise-list">
            {content.exercises.map((e) => (
              <section className="panel" key={e.id}>
                <Tag>{e.language}</Tag>
                <h2>{e.title}</h2>
                <p>{e.prompt}</p>
                <label>
                  Your solution
                  <textarea
                    className="code-editor"
                    spellCheck={false}
                    maxLength={20000}
                    value={state.drafts[e.id] ?? e.starter}
                    onChange={(v) =>
                      update((s) => ({
                        ...s,
                        drafts: { ...s.drafts, [e.id]: v.target.value },
                      }))
                    }
                  />
                </label>
                <button
                  className="text-button"
                  onClick={() =>
                    setRevealed({ ...revealed, [e.id]: !revealed[e.id] })
                  }
                >
                  {revealed[e.id]
                    ? "Hide worked solution"
                    : "Compare with worked solution"}
                  <ChevronRight size={16} />
                </button>
                {revealed[e.id] && (
                  <div className="worked-solution">
                    <pre>{e.solution}</pre>
                    <p>{e.explanation}</p>
                  </div>
                )}
              </section>
            ))}
          </div>
        </>
      )}
    </>
  );
}
function Projects({ state, update, content }) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">FROM PRACTICE TO PORTFOLIO</p>
          <h1>Build something you can explain.</h1>
          <p className="muted">
            Three focused briefs. Real datasets. Clear standards for good work.
          </p>
        </div>
      </div>
      <div className="project-list">
        {content.projects.map((p, i) => {
          const count = p.milestones.filter(
            (_, j) => state.milestones[`${p.id}-${j}`],
          ).length;
          return (
            <article className="project-card" key={p.id}>
              <div className="project-cover">
                <span>FIELDWORK / 0{i + 1}</span>
                <div
                  className={`project-glyph glyph-${i % 3}`}
                  aria-hidden="true"
                >
                  {Array.from({ length: 7 }, (_, j) => (
                    <i key={j} />
                  ))}
                </div>
                <strong>{p.tag}</strong>
              </div>
              <div className="project-body">
                <h2>{p.title}</h2>
                <p>{p.summary}</p>
                <a
                  className="resource-link"
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Dataset: {p.dataset}
                  <ArrowUpRight size={16} />
                </a>
                <div className="project-progress">
                  <span>
                    {count}/{p.milestones.length} milestones
                  </span>
                  <Progress
                    value={(count / p.milestones.length) * 100}
                    label={`${p.title} milestones`}
                  />
                </div>
                <h3>Your deliverables</h3>
                {p.milestones.map((m, j) => (
                  <label className="milestone" key={j}>
                    <input
                      type="checkbox"
                      checked={Boolean(state.milestones[`${p.id}-${j}`])}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        update((s) => ({
                          ...s,
                          milestones: {
                            ...s.milestones,
                            [`${p.id}-${j}`]: checked,
                          },
                          activity: record(
                            s,
                            `${checked ? "Completed" : "Reopened"} milestone ${j + 1}: ${p.title}`,
                          ),
                        }));
                      }}
                    />
                    <span>{m}</span>
                  </label>
                ))}
                <details>
                  <summary>How to review your work</summary>
                  <ul>
                    {p.rubric.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <p className="small muted">
                    Self-review rubric; no automatic grading or mentor review is
                    implied.
                  </p>
                </details>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
function LearningProgress({ state, content }) {
  const modules = trackModules(content, state.profile.track);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">EVIDENCE, NOT JUST A STREAK</p>
          <h1>Your learning record.</h1>
          <p className="muted">
            See what you have finished, what needs another look, and how your
            work is adding up.
          </p>
        </div>
        <Action
          secondary
          onClick={() => download("data-science-progress.json", state)}
        >
          <Download size={16} />
          Export backup
        </Action>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>Skills in progress</h2>
          {[...new Set(modules.map((m) => m.phase))].map((phase) => {
            const group = modules.filter((m) => m.phase === phase),
              count = group.filter((m) => state.completed[m.id]).length;
            return (
              <div className="skill-progress" key={phase}>
                <div>
                  <strong>{phase}</strong>
                  <span>
                    {count}/{group.length}
                  </span>
                </div>
                <Progress value={(count / group.length) * 100} label={phase} />
              </div>
            );
          })}
          <p className="small muted">
            Completion is self-reported. Quiz results and project deliverables
            add evidence of practice.
          </p>
        </section>
        <section className="panel">
          <h2>Worth another look</h2>
          {content.questions.filter(
            (q) => state.answers[q.id] && !state.answers[q.id].correct,
          ).length ? (
            content.questions
              .filter(
                (q) => state.answers[q.id] && !state.answers[q.id].correct,
              )
              .map((q) => (
                <Link
                  className="review-link"
                  to={`/practice?module=${q.module}`}
                  key={q.id}
                >
                  {q.prompt}
                  <ArrowUpRight size={16} />
                </Link>
              ))
          ) : (
            <Empty>
              No mistakes recorded. Try a knowledge check to find your next
              learning opportunity.
            </Empty>
          )}
        </section>
      </div>
      <section className="panel activity-panel">
        <h2>Recent activity</h2>
        {state.activity.length ? (
          <ol className="activity-list">
            {[...state.activity]
              .reverse()
              .slice(0, 20)
              .map((a, i) => (
                <li key={`${a.at}-${i}`}>
                  <span className="tiny-dot" />
                  <span>{a.label}</span>
                  <time dateTime={a.at}>{dateLabel(a.at)}</time>
                </li>
              ))}
          </ol>
        ) : (
          <Empty>Your learning actions will appear here.</Empty>
        )}
      </section>
    </>
  );
}
function WorkspaceSettings({ state, update, onPlan }) {
  const [auth, setAuth] = useState(() => {
      try {
        return JSON.parse(sessionStorage.getItem("ds-account") || "null");
      } catch {
        return null;
      }
    }),
    [mode, setMode] = useState("login"),
    [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [pending, setPending] = useState(null);
  async function run(fn) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
    } catch (e) {
      setMessage(e.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function signIn(e) {
    e.preventDefault();
    await run(async () => {
      const result = await request(`/auth/${mode}`, {
        method: "POST",
        body: { username, password },
      });
      setAuth(result);
      sessionStorage.setItem("ds-account", JSON.stringify(result));
      setPassword("");
      setMessage(
        "Signed in. Choose whether to upload this browser’s progress or preview your cloud backup.",
      );
    });
  }
  async function previewCloud() {
    await run(async () => {
      const result = await request("/progress", { token: auth.token });
      if (!result.workspace) {
        setMessage(
          "No cloud backup yet. Upload this browser’s progress first.",
        );
        return;
      }
      if (!validState(result.workspace))
        throw new Error("The cloud backup has an unsupported format.");
      setPending({
        state: result.workspace,
        source: `Cloud backup from ${dateLabel(result.updated_at)}`,
      });
    });
  }
  async function uploadCloud() {
    await run(async () => {
      await request("/progress", {
        method: "PUT",
        token: auth.token,
        body: { workspace: state },
      });
      setMessage("Cloud backup saved. Your other devices can now download it.");
    });
  }
  async function importFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    await run(async () => {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("Choose a backup smaller than 2 MB.");
      const value = JSON.parse(await file.text());
      if (!validState(value))
        throw new Error(
          "This is not a supported Data Science workspace backup. Your current progress has not changed.",
        );
      setPending({ state: value, source: file.name });
    });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE, YOUR CHOICE</p>
          <h1>A plan that stays with you.</h1>
          <p className="muted">
            Manage your study preferences and keep a copy of your progress.
          </p>
        </div>
      </div>
      <div className="settings-grid">
        <section className="panel">
          <h2>Your study plan</h2>
          <dl className="settings-facts">
            <div>
              <dt>Direction</dt>
              <dd>{trackName(state.profile.track)}</dd>
            </div>
            <div>
              <dt>Weekly time</dt>
              <dd>{state.profile.hours} hours</dd>
            </div>
            <div>
              <dt>Starting point</dt>
              <dd>
                {state.profile.level === "beginner"
                  ? "Foundations"
                  : "Some experience"}
              </dd>
            </div>
          </dl>
          <Action secondary onClick={onPlan}>
            Edit preferences
          </Action>
          <p className="small muted">
            Changing tracks keeps your completed topics, notes and practice
            results.
          </p>
        </section>
        <section className="panel">
          <h2>Keep a backup</h2>
          <p>
            Your progress lives in this browser. Export a backup before clearing
            browser data or moving devices.
          </p>
          <div className="dialog-actions">
            <Action
              secondary
              onClick={() => download("data-science-progress.json", state)}
            >
              <Download size={16} />
              Export JSON
            </Action>
            <label className="button secondary file-button">
              Import backup
              <input
                type="file"
                accept=".json,application/json"
                onChange={importFile}
                disabled={busy}
              />
            </label>
          </div>
          <p className="small muted">
            Imports are previewed before replacing your current workspace.
          </p>
        </section>
        <section className="panel account-panel">
          <Cloud size={25} />
          <h2>Optional account & cloud backup</h2>
          <p>
            Study without an account, or sign in to transfer your progress
            between devices. Sync is manual; upload and download only when you
            choose.
          </p>
          {!syncEnabled ? (
            <div className="notice">
              Cloud sync is not configured for this deployment. Export/import
              works without a server.
            </div>
          ) : auth ? (
            <>
              <p>
                Signed in as <strong>{auth.username}</strong>
              </p>
              <div className="dialog-actions">
                <Action
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        "Replace your cloud backup with the progress on this browser?",
                      )
                    )
                      uploadCloud();
                  }}
                >
                  Upload this progress
                </Action>
                <Action secondary disabled={busy} onClick={previewCloud}>
                  Preview cloud backup
                </Action>
                <button
                  className="text-button"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      try {
                        await request("/auth/logout", {
                          method: "POST",
                          token: auth.token,
                        });
                        setMessage(
                          "Signed out. Browser progress is unchanged.",
                        );
                      } catch {
                        setMessage(
                          "Signed out on this browser. The server could not revoke the session; it expires automatically.",
                        );
                      } finally {
                        sessionStorage.removeItem("ds-account");
                        setAuth(null);
                      }
                    })
                  }
                >
                  Sign out
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={signIn} className="form-stack auth-form">
              <div className="segmented">
                <button
                  type="button"
                  className={mode === "login" ? "active" : ""}
                  onClick={() => setMode("login")}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className={mode === "register" ? "active" : ""}
                  onClick={() => setMode("register")}
                >
                  Create account
                </button>
              </div>
              <label>
                Username
                <input
                  required
                  pattern="[A-Za-z0-9_]{3,40}"
                  title="3–40 letters, numbers or underscores"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </label>
              <label>
                Password
                <input
                  required
                  type="password"
                  minLength={12}
                  maxLength={128}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <p className="small muted">
                Use 12 or more characters and save your credentials. Password
                recovery is not available in this release.
              </p>
              <Action disabled={busy} type="submit">
                {busy
                  ? "Please wait…"
                  : mode === "login"
                    ? "Sign in"
                    : "Create account"}
              </Action>
            </form>
          )}
        </section>
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {pending && (
        <Dialog title="Review this backup" close={() => setPending(null)}>
          <p>
            <strong>{pending.source}</strong>
          </p>
          <p>
            {trackName(pending.state.profile.track)} ·{" "}
            {Object.keys(pending.state.completed).length} completed topics ·{" "}
            {Object.keys(pending.state.answers).length} answered checks
          </p>
          <p>
            This replaces progress on this browser. Export your current
            workspace first if you want to keep both versions.
          </p>
          <div className="dialog-actions">
            <Action
              secondary
              onClick={() => download("data-science-before-import.json", state)}
            >
              Export current progress
            </Action>
            <Action
              onClick={() => {
                update(pending.state);
                setPending(null);
                setMessage("Backup restored successfully.");
              }}
            >
              Restore this backup
            </Action>
          </div>
        </Dialog>
      )}
    </>
  );
}
function Admin({ content, setContent }) {
  const [key, setKey] = useState(""),
    [text, setText] = useState(JSON.stringify(content, null, 2)),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  async function publish(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const parsed = JSON.parse(text);
      if (!validContent(parsed))
        throw new Error(
          "Content validation failed. Check IDs, prerequisite order, HTTPS links, questions and required fields.",
        );
      await request("/content", { method: "PUT", admin: key, body: parsed });
      setContent(parsed);
      setMessage(
        "Published. Learners will receive this content when they next open the app.",
      );
    } catch (e) {
      setMessage(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONTENT WORKBENCH</p>
          <h1>Keep the learning useful.</h1>
          <p className="muted">
            Manage topics, resources, knowledge checks, exercises and project
            briefs in one structured document.
          </p>
        </div>
      </div>
      <section className="panel">
        <p>
          Keep existing IDs stable to preserve learner progress. Add new IDs for
          new topics or questions. Put prerequisite topics before the topics
          that depend on them. Remove entries to retire content.
        </p>
        <div className="notice">
          Publishing requires the server’s admin key. It is used only for this
          request and is not saved in browser storage. Without a server, export
          the JSON and replace{" "}
          <code>frontend/src/learning/curriculum.json</code> in GitHub.
        </div>
        <form className="form-stack" onSubmit={publish}>
          <label>
            Curriculum JSON
            <textarea
              className="code-editor content-editor"
              aria-label="Curriculum JSON"
              value={text}
              onChange={(e) => setText(e.target.value)}
              spellCheck={false}
            />
          </label>
          <label>
            Admin key
            <input
              type="password"
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
            />
          </label>
          <div className="dialog-actions">
            <Action disabled={busy || !syncEnabled || !key} type="submit">
              {busy ? "Publishing…" : "Publish content"}
            </Action>
            <Action
              secondary
              type="button"
              onClick={() => {
                try {
                  const parsed = JSON.parse(text);
                  if (!validContent(parsed))
                    throw new Error("Invalid content structure.");
                  download("curriculum.json", parsed);
                  setMessage("Validated and exported.");
                } catch (e) {
                  setMessage(e.message);
                }
              }}
            >
              Validate & export
            </Action>
          </div>
        </form>
        {message && (
          <p role="status" className="notice">
            {message}
          </p>
        )}
      </section>
    </>
  );
}
export default function LearningApp() {
  const { state, update, storageError } = useWorkspace();
  const [content, setContent] = useState(bundled),
    [plan, setPlan] = useState(false);
  const location = useLocation();
  useEffect(() => {
    if (syncEnabled)
      request("/content")
        .then((c) => {
          if (validContent(c)) setContent(c);
        })
        .catch(() => {});
  }, []);
  useEffect(() => {
    document.title = `${{ "/": "Overview", "/roadmap": "Roadmap", "/practice": "Practice", "/projects": "Projects", "/progress": "Progress", "/settings": "Settings", "/admin": "Content" }[location.pathname] || "Learn"} · Data Science`;
    window.scrollTo(0, 0);
  }, [location.pathname]);
  const modules = trackModules(content, state.profile.track),
    done = modules.filter((m) => state.completed[m.id]).length;
  const nav = [
    ["/", "Overview", LayoutDashboard],
    ["/roadmap", "My roadmap", Map],
    ["/practice", "Practice lab", Code2],
    ["/projects", "Projects", Briefcase],
    ["/progress", "My progress", Target],
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <i />
            <i />
            <i />
          </span>
          <span>
            data<span className="brand-serif">science</span>
            <small>THE LEARNING WORKSPACE</small>
          </span>
        </Link>
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          {nav.map(([to, label, Icon]) => (
            <NavLink
              end={to === "/"}
              key={to}
              to={to}
              className={({ isActive }) =>
                isActive ? "nav-link active" : "nav-link"
              }
            >
              <Icon size={18} />
              <span>{label}</span>
              {to === "/practice" && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-plan">
          <span className="eyebrow">YOUR DIRECTION</span>
          <strong>{trackName(state.profile.track)}</strong>
          <Progress
            value={(done / modules.length) * 100}
            label="Sidebar roadmap progress"
          />
          <div>
            <span>
              {done} of {modules.length} topics
            </span>
            <button className="text-button" onClick={() => setPlan(true)}>
              Edit <ArrowUpRight size={13} />
            </button>
          </div>
        </div>
        <div className="sidebar-bottom">
          <NavLink to="/settings" className="nav-link">
            <Settings size={18} />
            Settings & backup
          </NavLink>
          <a
            className="nav-link"
            href="https://github.com/Sido-dev/Data-Science"
            target="_blank"
            rel="noreferrer"
          >
            <Github size={18} />
            View the source
            <ArrowUpRight size={14} />
          </a>
          <div className="maker">
            <span className="maker-avatar">SN</span>
            <div>
              <small>DESIGNED & BUILT BY</small>
              <a
                href="https://github.com/Sido-dev"
                target="_blank"
                rel="noreferrer"
              >
                Sudhanshu V. Narayane <ArrowUpRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <ChevronRight size={13} />
            <span>
              {nav.find((n) => n[0] === location.pathname)?.[1] || "Settings"}
            </span>
          </div>
          <Link to="/settings" className="save-indicator">
            <span className="tiny-dot" />
            {storageError ? "Backup needed" : "Browser workspace"}
          </Link>
        </header>
        <main id="main" tabIndex={-1}>
          {storageError && (
            <div role="alert" className="notice error">
              {storageError}
            </div>
          )}
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  state={state}
                  content={content}
                  onPlan={() => setPlan(true)}
                />
              }
            />
            <Route
              path="/roadmap"
              element={
                <Roadmap
                  state={state}
                  update={update}
                  content={content}
                  onPlan={() => setPlan(true)}
                />
              }
            />
            <Route
              path="/practice"
              element={
                <Practice
                  key={location.search}
                  state={state}
                  update={update}
                  content={content}
                />
              }
            />
            <Route
              path="/projects"
              element={
                <Projects state={state} update={update} content={content} />
              }
            />
            <Route
              path="/progress"
              element={<LearningProgress state={state} content={content} />}
            />
            <Route
              path="/settings"
              element={
                <WorkspaceSettings
                  state={state}
                  update={update}
                  onPlan={() => setPlan(true)}
                />
              }
            />
            <Route
              path="/admin"
              element={<Admin content={content} setContent={setContent} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <footer className="footer">
            <span>Learn with purpose. Build with evidence.</span>
            <span>
              Made by{" "}
              <a
                href="https://github.com/Sido-dev"
                target="_blank"
                rel="noreferrer"
              >
                Sudhanshu Vijay Narayane
              </a>
            </span>
          </footer>
        </main>
      </div>
      {plan && (
        <Dialog title="Make the plan yours." close={() => setPlan(false)}>
          <PlanForm
            profile={state.profile}
            close={() => setPlan(false)}
            save={(profile) =>
              update((s) => ({
                ...s,
                profile,
                activity: record(s, "Updated study plan"),
              }))
            }
          />
        </Dialog>
      )}
    </div>
  );
}
