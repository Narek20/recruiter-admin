import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { createImport } from "../api";
import { getErrorMessage } from "../lib/getErrorMessage";
import { ImportEntity, ImportResult } from "../types/import";

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
};

export function ImportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const uploadSectionRef = useRef<HTMLElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [entity, setEntity] = useState<ImportEntity>("schools");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const selectedTemplate = useMemo(() => importTemplates[entity], [entity]);

  useEffect(() => {
    const value = searchParams.get("entity");
    if (value === "schools" || value === "majors") {
      setEntity(value);
    }
  }, [searchParams]);

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
    setResult(null);

    try {
      const response = await createImport({ entity, file });
      setNotice(`${file.name} processed successfully.`);
      setResult(response);
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

      <section className="panel" ref={uploadSectionRef}>
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">New upload</p>
            <h3>Prepare import batch</h3>
          </div>
        </div>

        {error ? <div className="empty-state">{error}</div> : null}

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
            </select>
          </label>
          <label className="field">
            <span>Mode</span>
            <input disabled value="Upsert" />
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
          <p>{selectedTemplate.join(", ")}</p>
        </div>
      </section>

      {result ? (
        <section className="page-shell">
          <div className="page-header">
            <div>
              <p className="page-eyebrow">Import result</p>
              <h3 className="page-title">{result.filename}</h3>
              <p className="page-copy">
                {result.entity} import finished with {result.processed} processed rows.
              </p>
            </div>
            <span
              className={`status-pill ${
                result.failed > 0 ? "status-pill-warn" : "status-pill-live"
              }`}
            >
              {result.failed > 0 ? "Completed with errors" : "Completed"}
            </span>
          </div>

          <div className="stats-grid">
            <article className="stat-card">
              <p className="stat-label">Processed</p>
              <strong className="stat-value">{result.processed}</strong>
              <span className="stat-note">Rows parsed from CSV</span>
            </article>
            <article className="stat-card">
              <p className="stat-label">Created</p>
              <strong className="stat-value">{result.created}</strong>
              <span className="stat-note">New records inserted</span>
            </article>
            <article className="stat-card">
              <p className="stat-label">Updated</p>
              <strong className="stat-value">{result.updated}</strong>
              <span className="stat-note">Existing records changed</span>
            </article>
            <article className="stat-card">
              <p className="stat-label">Failed</p>
              <strong className="stat-value">{result.failed}</strong>
              <span className="stat-note">Rows needing review</span>
            </article>
          </div>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-eyebrow">Row feedback</p>
                <h3>Error details</h3>
              </div>
              <span className="status-pill">{result.errors.length} issues</span>
            </div>

            {result.errors.length === 0 ? (
              <div className="empty-state">No row-level errors. The import completed cleanly.</div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((item) => (
                      <tr key={`${item.row}-${item.message}`}>
                        <td>Row {item.row}</td>
                        <td>{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </section>
      ) : null}
    </section>
  );
}
