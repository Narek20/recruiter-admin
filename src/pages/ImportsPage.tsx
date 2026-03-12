import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createImport, getImports } from "../api";
import { getErrorMessage } from "../lib/getErrorMessage";
import { ImportEntity, ImportJob } from "../types/import";

const importTemplates: Record<ImportEntity, string[]> = {
  schools: [
    "externalId",
    "name",
    "city",
    "state",
    "country",
    "logoUrl",
    "website",
    "division",
    "conference",
    "tier",
    "enrollment",
    "acceptanceRate",
    "tuitionInState",
    "tuitionOutOfState",
    "latitude",
    "longitude",
  ],
  majors: ["externalId", "name", "category"],
  school_majors: ["schoolExternalId", "majorExternalId", "schoolName", "majorName"],
};

export function ImportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const uploadSectionRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [entity, setEntity] = useState<ImportEntity>("schools");
  const [file, setFile] = useState<File | null>(null);
  const [jobs, setJobs] = useState<ImportJob[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedTemplate = useMemo(() => importTemplates[entity], [entity]);

  useEffect(() => {
    const value = searchParams.get("entity");
    if (value === "schools" || value === "majors" || value === "school_majors") {
      setEntity(value);
    }
  }, [searchParams]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getImports({ page, pageSize });
        if (!active) return;
        setJobs(result.items);
        setTotal(result.total);
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to load imports"));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [page, pageSize]);

  useEffect(() => {
    const hasProcessingJobs = jobs.some(
      (job) => job.status === "pending" || job.status === "processing",
    );

    if (!hasProcessingJobs) return;

    const interval = window.setInterval(async () => {
      try {
        const result = await getImports({ page, pageSize });
        setJobs(result.items);
        setTotal(result.total);
      } catch {
        window.clearInterval(interval);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [jobs, page, pageSize]);

  const loadImports = async (nextPage = page, nextPageSize = pageSize) => {
    setIsLoading(true);
    setError("");

    try {
      const result = await getImports({ page: nextPage, pageSize: nextPageSize });
      setJobs(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load imports"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setNotice("");
    setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setNotice("");

    try {
      await createImport({ entity, file });
      setNotice(`${file.name} uploaded successfully. Import job queued.`);
      setPage(1);
      await loadImports(1, pageSize);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(getErrorMessage(err, "Failed to start import"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csv = `${selectedTemplate.join(",")}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${entity}-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleStartImportClick = () => {
    uploadSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    fileInputRef.current?.focus();
  };

  const handleRefreshImports = async () => {
    await loadImports(page, pageSize);
  };

  return (
    <section className="page-shell">
      <div className="page-header page-header-actions">
        <div>
          <p className="page-eyebrow">Imports</p>
          <h2 className="page-title">CSV intake and validation</h2>
          <p className="page-copy">
            Upload raw school, major, and relationship files, then review row-level outcomes.
          </p>
        </div>
        <div className="toolbar-actions">
          <button className="secondary-button" onClick={handleDownloadTemplate} type="button">
            Download template
          </button>
          <button className="primary-button" onClick={handleStartImportClick} type="button">
            Start import
          </button>
        </div>
      </div>

      {notice ? <div className="notice-banner">{notice}</div> : null}

      <div className="content-grid content-grid-two">
        <section className="panel" ref={uploadSectionRef}>
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">New upload</p>
              <h3>Prepare import batch</h3>
            </div>
          </div>

          <form className="form-grid form-grid-two" onSubmit={handleSubmit}>
            <label className="field">
              <span>Dataset</span>
              <select
                onChange={(event) => {
                  const nextEntity = event.target.value as ImportEntity;
                  setEntity(nextEntity);
                  setSearchParams({ entity: nextEntity });
                  setNotice("");
                }}
                value={entity}
              >
                <option value="schools">Schools</option>
                <option value="majors">Majors</option>
                <option value="school_majors">School-Majors</option>
              </select>
            </label>
            <label className="field">
              <span>Mode</span>
              <select defaultValue="upsert" disabled>
                <option value="upsert">Upsert</option>
              </select>
            </label>
            <label className="field field-full">
              <span>CSV file</span>
              <input accept=".csv,text/csv" onChange={handleFileChange} ref={fileInputRef} type="file" />
            </label>
            {file ? (
              <div className="file-summary field-full">
                <div>
                  <strong>{file.name}</strong>
                  <p>
                    {(file.size / 1024).toFixed(1)} KB · {entity}
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }}
                  type="button"
                >
                  Clear file
                </button>
              </div>
            ) : null}
            <div className="field field-full">
              <button className="primary-button" disabled={isSubmitting} type="submit">
                {isSubmitting ? "Uploading..." : "Start import"}
              </button>
            </div>
          </form>

          <div className="callout">
            <strong>Expected columns</strong>
            <p>
              {selectedTemplate.join(", ")}
            </p>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Import history</p>
              <h3>Recent jobs</h3>
            </div>
            <button className="secondary-button" onClick={handleRefreshImports} type="button">
              Refresh
            </button>
          </div>

          <div className="stack-list">
            {error ? <div className="empty-state">{error}</div> : null}
            {!error && isLoading ? <div className="empty-state">Loading import jobs...</div> : null}
            {!error && !isLoading && jobs.map((job) => (
              <article className="list-card" key={job.id || job._id || job.fileName}>
                <div>
                  <strong>{job.fileName}</strong>
                  <p>
                    {job.entity} · {job.importedRows}/{job.totalRows} rows processed
                  </p>
                  {job.failedRows ? <p>{job.failedRows} failed rows</p> : null}
                </div>
                <span
                  className={`status-pill ${
                    job.status === "completed"
                      ? "status-pill-live"
                      : job.status === "failed"
                        ? "status-pill-warn"
                        : ""
                  }`}
                >
                  {job.status}
                </span>
              </article>
            ))}
            {!error && !isLoading && jobs.length === 0 ? (
              <div className="empty-state">No import jobs found.</div>
            ) : null}
          </div>
          {!error && !isLoading && jobs.length > 0 ? (
            <div className="pagination-bar">
              <div className="pagination-meta">
                <span>
                  Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
                </span>
                <label className="pagination-size">
                  <span>Rows</span>
                  <select
                    onChange={(event) => {
                      setPageSize(Number(event.target.value));
                      setPage(1);
                    }}
                    value={pageSize}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </label>
              </div>
              <div className="pagination-controls">
                <button
                  className="secondary-button"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  type="button"
                >
                  Previous
                </button>
                <span className="pagination-page">
                  Page {page} of {totalPages}
                </span>
                <button
                  className="secondary-button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
