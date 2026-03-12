import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { createSchoolMajor, getMajors, getSchoolMajors, getSchools } from "../api";
import { getErrorMessage } from "../lib/getErrorMessage";
import { Major } from "../types/major";
import { School } from "../types/school";
import { SchoolMajor } from "../types/schoolMajor";

export function SchoolMajorsPage() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [selectedMajorId, setSelectedMajorId] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [mappings, setMappings] = useState<SchoolMajor[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    schoolId: "",
    majorId: "",
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const filteredMappings = mappings.filter((mapping) => {
    const matchesSchool = !selectedSchoolId || mapping.schoolId === selectedSchoolId;
    const matchesMajor = !selectedMajorId || mapping.majorId === selectedMajorId;
    const matchesStatus =
      !selectedStatus || (selectedStatus === "active" ? mapping.isActive : !mapping.isActive);

    return matchesSchool && matchesMajor && matchesStatus;
  });

  async function loadMappings(nextPage = page, nextPageSize = pageSize) {
    const [mappingsResult, schoolsResult, majorsResult] = await Promise.all([
      getSchoolMajors({ page: nextPage, pageSize: nextPageSize }),
      getSchools({ page: 1, pageSize: 200 }),
      getMajors({ page: 1, pageSize: 200 }),
    ]);

    setMappings(mappingsResult.items);
    setTotal(mappingsResult.total);
    setSchools(schoolsResult.items);
    setMajors(majorsResult.items);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [mappingsResult, schoolsResult, majorsResult] = await Promise.all([
          getSchoolMajors({ page, pageSize }),
          getSchools({ page: 1, pageSize: 200 }),
          getMajors({ page: 1, pageSize: 200 }),
        ]);
        if (!active) return;
        setMappings(mappingsResult.items);
        setTotal(mappingsResult.total);
        setSchools(schoolsResult.items);
        setMajors(majorsResult.items);
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to load school-major mappings"));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [page, pageSize]);

  const handleFormChange =
    (field: "schoolId" | "majorId") => (event: ChangeEvent<HTMLSelectElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleCreateMapping = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsCreating(true);

    try {
      await createSchoolMajor({ schoolId: form.schoolId, majorId: form.majorId, isActive: true });
      setNotice("School-major mapping created successfully.");
      setShowCreateForm(false);
      setForm({ schoolId: "", majorId: "" });
      setPage(1);
      setIsLoading(true);
      await loadMappings(1, pageSize);
      setIsLoading(false);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create mapping"));
      setIsLoading(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="page-header page-header-actions">
        <div>
          <p className="page-eyebrow">Mappings</p>
          <h2 className="page-title">School-major relationships</h2>
          <p className="page-copy">
            Control which majors belong to which school without polluting the master collections.
          </p>
        </div>
        <div className="toolbar-actions">
          <button
            className="primary-button"
            onClick={() => setShowCreateForm((current) => !current)}
            type="button"
          >
            {showCreateForm ? "Close form" : "Add mapping"}
          </button>
        </div>
      </div>

      {notice ? <div className="notice-banner">{notice}</div> : null}

      {showCreateForm ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Create relationship</p>
              <h3>Link a school to a major</h3>
            </div>
          </div>

          <form className="form-grid form-grid-two" onSubmit={handleCreateMapping}>
            <label className="field">
              <span>School</span>
              <select onChange={handleFormChange("schoolId")} value={form.schoolId}>
                <option value="">Select school</option>
                {schools.map((school) => (
                  <option key={school.id || school._id} value={school.id || school._id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Major</span>
              <select onChange={handleFormChange("majorId")} value={form.majorId}>
                <option value="">Select major</option>
                {majors.map((major) => (
                  <option key={major.id || major._id} value={major.id || major._id}>
                    {major.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="field field-full">
              <button
                className="primary-button"
                disabled={isCreating || !form.schoolId || !form.majorId}
                type="submit"
              >
                {isCreating ? "Creating..." : "Create mapping"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel filters-panel">
        <div className="form-grid form-grid-three">
          <label className="field">
            <span>School</span>
            <select onChange={(event) => setSelectedSchoolId(event.target.value)} value={selectedSchoolId}>
              <option value="">All schools</option>
              {schools.map((school) => (
                <option key={school.id || school._id} value={school.id || school._id}>
                  {school.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Major</span>
            <select onChange={(event) => setSelectedMajorId(event.target.value)} value={selectedMajorId}>
              <option value="">All majors</option>
              {majors.map((major) => (
                <option key={major.id || major._id} value={major.id || major._id}>
                  {major.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select onChange={(event) => setSelectedStatus(event.target.value)} value={selectedStatus}>
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Archived</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Relationship table</p>
            <h3>{isLoading ? "Loading mappings..." : `${total} active and archived links`}</h3>
          </div>
          <span className="status-pill status-pill-live">Live API</span>
        </div>

        {error ? <div className="empty-state">{error}</div> : null}
        {!error && !isLoading && mappings.length > 0 && filteredMappings.length === 0 ? (
          <div className="empty-state">No relationships matched the selected filters on this page.</div>
        ) : null}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Major</th>
                <th>Relation ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMappings.map((mapping) => (
                <tr key={mapping.id || mapping._id}>
                  <td>{mapping.schoolName || mapping.schoolId}</td>
                  <td>{mapping.majorName || mapping.majorId}</td>
                  <td>{mapping.id || mapping._id}</td>
                  <td>
                    <span
                      className={`status-pill ${
                        mapping.isActive ? "status-pill-live" : "status-pill-muted"
                      }`}
                    >
                      {mapping.isActive ? "Active" : "Archived"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!error && !isLoading && mappings.length > 0 ? (
          <div className="pagination-bar">
            <div className="pagination-meta">
              <span>
                Showing {filteredMappings.length} of {mappings.length} rows on this page · total {total}
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
                  <option value={100}>100</option>
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
    </section>
  );
}
