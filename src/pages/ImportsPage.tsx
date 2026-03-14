import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "react-router-dom";
import { createImport } from "../api";
import { getErrorMessage } from "../lib/getErrorMessage";
import { ImportEntity, ImportResult } from "../types/import";

const importTemplates: Record<ImportEntity, string[]> = {
  schools: [
    "school_id",
    "unitid",
    "school_name",
    "school_aliases",
    "school_website",
    "city",
    "state",
    "zip",
    "country",
    "address_full",
    "latitude",
    "longitude",
    "enrollment_total",
    "admissions_rate",
    "tuition_in_state",
    "tuition_out_of_state",
    "school_size_bucket",
    "selectivity_bucket",
    "source_system",
    "source_url",
    "source_data_year",
    "last_verified_at",
  ],
  majors: [
    "major_id",
    "cip_code",
    "canonical_major_name",
    "major_category",
    "active_status",
    "notes",
  ],
  school_majors: [
    "school_id",
    "major_id",
    "award_level",
    "source_display_name",
    "source_url",
    "last_verified_at",
    "match_status",
    "notes",
  ],
  logos: [
    "logo_id",
    "entity_type",
    "entity_id",
    "logo_type",
    "logo_source_page_url",
    "logo_file_url",
    "downloaded_filename",
    "is_primary",
    "rights_note",
    "last_checked_at",
  ],
};

const importEntityOptions: ImportEntity[] = [
  "schools",
  "majors",
  "school_majors",
  "logos",
];

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
    if (value && importEntityOptions.includes(value as ImportEntity)) {
      setEntity(value as ImportEntity);
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
    uploadSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    fileInputRef.current?.focus();
  };

  return (
    <section className="page-shell">
      <div className="page-header page-header-actions">
        <div>
          <p className="page-eyebrow">Imports</p>
          <h2 className="page-title">CSV intake and validation</h2>
          <p className="page-copy">
            Upload raw school, major, school-major, and logo files, then review
            row-level outcomes.
          </p>
        </div>
        <div className="toolbar-actions">
          <button
            className="secondary-button"
            onClick={handleDownloadTemplate}
            type="button"
          >
            Download template
          </button>
          <button
            className="primary-button"
            onClick={handleStartImportClick}
            type="button"
          >
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
              <option value="school_majors">School-Majors</option>
              <option value="logos">Logos</option>
            </select>
          </label>
          <label className="field">
            <span>Mode</span>
            <input disabled value="Upsert" />
          </label>
          <label className="field field-full">
            <span>CSV file</span>
            <input
              accept=".csv,text/csv"
              onChange={handleFileChange}
              ref={fileInputRef}
              type="file"
            />
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
            <button
              className="primary-button"
              disabled={isSubmitting}
              type="submit"
            >
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
              <h2 className="page-title">{result.filename}</h2>
              <p className="page-copy">
                Processed {result.processed} rows with {result.failed} failures.
              </p>
            </div>
          </div>

          <section className="panel">
            <div className="stats-grid">
              <article className="stat-card">
                <span className="stat-label">Created</span>
                <strong>{result.created}</strong>
              </article>
              <article className="stat-card">
                <span className="stat-label">Updated</span>
                <strong>{result.updated}</strong>
              </article>
              <article className="stat-card">
                <span className="stat-label">Failed</span>
                <strong>{result.failed}</strong>
              </article>
              <article className="stat-card">
                <span className="stat-label">Duplicates</span>
                <strong>{result.skippedDuplicates || 0}</strong>
              </article>
            </div>
          </section>

          {result.duplicates?.length ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Duplicates</p>
                  <h3>Skipped duplicate rows</h3>
                </div>
              </div>
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Matched Row</th>
                      <th>Reason</th>
                      <th>Identifier</th>
                      <th>Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.duplicates.map((item) => (
                      <tr key={`${item.row}-${item.matchedRow}-${item.reason}`}>
                        <td>{item.row}</td>
                        <td>{item.matchedRow}</td>
                        <td>{item.reason}</td>
                        <td>{item.identifier || "-"}</td>
                        <td>{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {result.errors.length ? (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="panel-eyebrow">Row errors</p>
                  <h3>Review failed rows</h3>
                </div>
              </div>
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
                        <td>{item.row}</td>
                        <td>{item.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </section>
      ) : null}
    </section>
  );
}
