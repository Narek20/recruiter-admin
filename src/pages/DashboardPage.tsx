import { useEffect, useState } from "react";
import { getImports, getMajors, getSchoolMajors, getSchools } from "../api";
import { getErrorMessage } from "../lib/getErrorMessage";

const activity = [
  "NCAA schools import finished with 842 rows processed.",
  "14 major aliases were merged into canonical records.",
  "School-major mapping queue dropped below 100 unresolved rows.",
  "Three inactive schools were archived after manual review.",
];

const queue = [
  { title: "Review duplicate major names", owner: "Data Ops", priority: "High" },
  { title: "Validate new conference assignments", owner: "Admin", priority: "Medium" },
  { title: "Prepare coach import schema", owner: "Backend", priority: "Medium" },
];

export function DashboardPage() {
  const [stats, setStats] = useState([
    { label: "Schools", value: "-", note: "Waiting for API" },
    { label: "Majors", value: "-", note: "Waiting for API" },
    { label: "Links", value: "-", note: "Waiting for API" },
    { label: "Imports", value: "-", note: "Waiting for API" },
  ]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [schools, majors, mappings, imports] = await Promise.allSettled([
          getSchools({ page: 1, pageSize: 1 }),
          getMajors({ page: 1, pageSize: 1 }),
          getSchoolMajors({ page: 1, pageSize: 1 }),
          getImports({ page: 1, pageSize: 1 }),
        ]);

        if (!active) return;

        setStats([
          {
            label: "Schools",
            value: schools.status === "fulfilled" ? String(schools.value.total) : "N/A",
            note: schools.status === "fulfilled" ? "Live records" : "Endpoint unavailable",
          },
          {
            label: "Majors",
            value: majors.status === "fulfilled" ? String(majors.value.total) : "N/A",
            note: majors.status === "fulfilled" ? "Live records" : "Endpoint unavailable",
          },
          {
            label: "Links",
            value: mappings.status === "fulfilled" ? String(mappings.value.total) : "N/A",
            note: mappings.status === "fulfilled" ? "Live mappings" : "Endpoint unavailable",
          },
          {
            label: "Imports",
            value: imports.status === "fulfilled" ? String(imports.value.total) : "N/A",
            note: imports.status === "fulfilled" ? "Recent jobs" : "Endpoint unavailable",
          },
        ]);
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to load dashboard summary"));
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="page-shell">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Overview</p>
          <h2 className="page-title">Data command center</h2>
          <p className="page-copy">
            Track collection health, import throughput, and manual review work from one place.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((metric) => (
          <article className="stat-card" key={metric.label}>
            <p className="stat-label">{metric.label}</p>
            <strong className="stat-value">{metric.value}</strong>
            <span className="stat-note">{metric.note}</span>
          </article>
        ))}
      </div>

      {error ? <div className="panel empty-state">{error}</div> : null}

      <div className="content-grid content-grid-two">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Recent activity</p>
              <h3>Import and cleanup stream</h3>
            </div>
            <span className="status-pill">Today</span>
          </div>

          <div className="timeline">
            {activity.map((item) => (
              <div className="timeline-item" key={item}>
                <span className="timeline-dot" />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Action queue</p>
              <h3>Manual review tasks</h3>
            </div>
          </div>

          <div className="stack-list">
            {queue.map((item) => (
              <article className="list-card" key={item.title}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.owner}</p>
                </div>
                <span className={`status-pill ${item.priority === "High" ? "status-pill-warn" : ""}`}>
                  {item.priority}
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
