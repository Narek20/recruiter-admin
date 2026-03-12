import {
  ChangeEvent,
  FormEvent,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { createSchool, deleteSchool, getSchools, updateSchool } from "../api";
import { getErrorMessage } from "../lib/getErrorMessage";
import { School, UpsertSchoolPayload } from "../types/school";

function createSchoolPayload(school?: Partial<School>): UpsertSchoolPayload {
  return {
    externalId: school?.externalId || school?.slug || "",
    name: school?.name || "",
    city: school?.city || "",
    state: school?.state || "",
    country: school?.country || "USA",
    website: school?.website || "",
    logoUrl: school?.logoUrl || "",
    division: school?.division || "",
    conference: school?.conference || "",
    tier: school?.tier || "",
    enrollment: school?.enrollment ?? null,
    acceptanceRate: school?.acceptanceRate ?? null,
    tuitionInState: school?.tuitionInState ?? null,
    tuitionOutOfState: school?.tuitionOutOfState ?? null,
    latitude: school?.latitude ?? null,
    longitude: school?.longitude ?? null,
    isActive: school?.isActive ?? true,
  };
}

export function SchoolsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [schools, setSchools] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [form, setForm] = useState<UpsertSchoolPayload>(createSchoolPayload());
  const [editForm, setEditForm] = useState<UpsertSchoolPayload>(createSchoolPayload());

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const stateOptions = useMemo(
    () => Array.from(new Set(schools.map((school) => school.state).filter(Boolean))).sort(),
    [schools],
  );
  const divisionOptions = useMemo(
    () =>
      Array.from(new Set(schools.map((school) => school.division).filter(Boolean))).sort(),
    [schools],
  );
  const filteredSchools = useMemo(
    () =>
      schools.filter((school) => {
        const matchesState = !selectedState || school.state === selectedState;
        const matchesDivision = !selectedDivision || school.division === selectedDivision;
        const matchesStatus =
          !selectedStatus ||
          (selectedStatus === "active" ? school.isActive : !school.isActive);

        return matchesState && matchesDivision && matchesStatus;
      }),
    [schools, selectedDivision, selectedState, selectedStatus],
  );

  async function loadSchools(searchValue = deferredQuery, nextPage = page, nextPageSize = pageSize) {
    setIsLoading(true);
    setError("");

    try {
      const result = await getSchools({ search: searchValue, page: nextPage, pageSize: nextPageSize });
      setSchools(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load schools"));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getSchools({ search: deferredQuery, page, pageSize });
        if (!active) return;
        setSchools(result.items);
        setTotal(result.total);
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to load schools"));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [deferredQuery, page, pageSize]);

  const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setPage(1);
  };

  const handleFormChange =
    (field: keyof UpsertSchoolPayload) =>
    (
      event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
      target: "create" | "edit" = "create",
    ) => {
      const value = event.target.value;
      const setter = target === "create" ? setForm : setEditForm;

      setter((current) => ({
        ...current,
        [field]:
          field === "enrollment" ||
          field === "acceptanceRate" ||
          field === "tuitionInState" ||
          field === "tuitionOutOfState" ||
          field === "latitude" ||
          field === "longitude"
            ? (value ? Number(value) : null)
            : value,
      }));
    };

  const handleCreateSchool = async (event: FormEvent) => {
    event.preventDefault();
    setIsCreating(true);
    setError("");
    setNotice("");

    try {
      await createSchool(form);
      setNotice("School created successfully.");
      setShowCreateForm(false);
      setForm(createSchoolPayload());
      setPage(1);
      await loadSchools(query, 1, pageSize);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create school"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (school: School) => {
    setEditingSchoolId(school.id || school._id || null);
    setEditForm(createSchoolPayload(school));
    setShowCreateForm(false);
    setNotice("");
    setError("");
  };

  const handleUpdateSchool = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingSchoolId) return;

    setIsSavingEdit(true);
    setError("");
    setNotice("");

    try {
      await updateSchool(editingSchoolId, editForm);
      setNotice("School updated successfully.");
      setEditingSchoolId(null);
      await loadSchools(query, page, pageSize);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update school"));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteSchool = async (school: School) => {
    const id = school.id || school._id;
    if (!id) return;

    setError("");
    setNotice("");

    try {
      await deleteSchool(id);
      setNotice(`${school.name} deleted successfully.`);
      await loadSchools(query, page, pageSize);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete school"));
    }
  };

  return (
    <section className="page-shell">
      <div className="page-header page-header-actions">
        <div>
          <p className="page-eyebrow">Schools</p>
          <h2 className="page-title">School directory management</h2>
          <p className="page-copy">
            Keep canonical school records clean before mapping majors or importing coach data.
          </p>
        </div>
        <div className="toolbar-actions">
          <button
            className="secondary-button"
            onClick={() => navigate("/imports?entity=schools")}
            type="button"
          >
            Import CSV
          </button>
          <button
            className="primary-button"
            onClick={() => setShowCreateForm((current) => !current)}
            type="button"
          >
            {showCreateForm ? "Close form" : "Add school"}
          </button>
        </div>
      </div>

      {notice ? <div className="notice-banner">{notice}</div> : null}

      {showCreateForm ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Create school</p>
              <h3>Add a new school record</h3>
            </div>
          </div>

          <form className="form-grid form-grid-four" onSubmit={handleCreateSchool}>
            <label className="field">
              <span>External ID</span>
              <input onChange={handleFormChange("externalId")} value={form.externalId} />
            </label>
            <label className="field">
              <span>Name</span>
              <input onChange={handleFormChange("name")} value={form.name} />
            </label>
            <label className="field">
              <span>City</span>
              <input onChange={handleFormChange("city")} value={form.city} />
            </label>
            <label className="field">
              <span>State</span>
              <input onChange={handleFormChange("state")} value={form.state} />
            </label>
            <label className="field">
              <span>Country</span>
              <input onChange={handleFormChange("country")} value={form.country} />
            </label>
            <label className="field">
              <span>Website</span>
              <input onChange={handleFormChange("website")} value={form.website || ""} />
            </label>
            <label className="field">
              <span>Logo URL</span>
              <input onChange={handleFormChange("logoUrl")} value={form.logoUrl || ""} />
            </label>
            <label className="field">
              <span>Division</span>
              <input onChange={handleFormChange("division")} value={form.division || ""} />
            </label>
            <label className="field">
              <span>Conference</span>
              <input onChange={handleFormChange("conference")} value={form.conference || ""} />
            </label>
            <label className="field">
              <span>Tier</span>
              <input onChange={handleFormChange("tier")} value={form.tier || ""} />
            </label>
            <label className="field">
              <span>Enrollment</span>
              <input onChange={handleFormChange("enrollment")} type="number" value={form.enrollment ?? ""} />
            </label>
            <label className="field">
              <span>Acceptance Rate</span>
              <input
                onChange={handleFormChange("acceptanceRate")}
                type="number"
                value={form.acceptanceRate ?? ""}
              />
            </label>
            <div className="field field-full">
              <button className="primary-button" disabled={isCreating} type="submit">
                {isCreating ? "Creating..." : "Create school"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {editingSchoolId ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Edit school</p>
              <h3>Update school record</h3>
            </div>
          </div>

          <form className="form-grid form-grid-four" onSubmit={handleUpdateSchool}>
            <label className="field">
              <span>External ID</span>
              <input
                onChange={(event) => handleFormChange("externalId")(event, "edit")}
                value={editForm.externalId}
              />
            </label>
            <label className="field">
              <span>Name</span>
              <input onChange={(event) => handleFormChange("name")(event, "edit")} value={editForm.name} />
            </label>
            <label className="field">
              <span>City</span>
              <input onChange={(event) => handleFormChange("city")(event, "edit")} value={editForm.city} />
            </label>
            <label className="field">
              <span>State</span>
              <input onChange={(event) => handleFormChange("state")(event, "edit")} value={editForm.state} />
            </label>
            <label className="field">
              <span>Website</span>
              <input
                onChange={(event) => handleFormChange("website")(event, "edit")}
                value={editForm.website || ""}
              />
            </label>
            <label className="field">
              <span>Division</span>
              <input
                onChange={(event) => handleFormChange("division")(event, "edit")}
                value={editForm.division || ""}
              />
            </label>
            <label className="field">
              <span>Conference</span>
              <input
                onChange={(event) => handleFormChange("conference")(event, "edit")}
                value={editForm.conference || ""}
              />
            </label>
            <label className="field">
              <span>Tier</span>
              <input onChange={(event) => handleFormChange("tier")(event, "edit")} value={editForm.tier || ""} />
            </label>
            <div className="field field-full action-row">
              <button className="primary-button" disabled={isSavingEdit} type="submit">
                {isSavingEdit ? "Saving..." : "Save changes"}
              </button>
              <button
                className="secondary-button"
                onClick={() => setEditingSchoolId(null)}
                type="button"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="panel filters-panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Filters</p>
            <h3>Search and segment records</h3>
          </div>
        </div>

        <div className="form-grid form-grid-four">
          <label className="field">
            <span>Search</span>
            <input
              onChange={handleQueryChange}
              placeholder="School name, city, state"
              value={query}
            />
          </label>
          <label className="field">
            <span>State</span>
            <select onChange={(event) => setSelectedState(event.target.value)} value={selectedState}>
              <option value="">All states</option>
              {stateOptions.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Division</span>
            <select
              onChange={(event) => setSelectedDivision(event.target.value)}
              value={selectedDivision}
            >
              <option value="">All divisions</option>
              {divisionOptions.map((division) => (
                <option key={division} value={division}>
                  {division}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              onChange={(event) => setSelectedStatus(event.target.value)}
              value={selectedStatus}
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="panel-eyebrow">Records</p>
            <h3>{isLoading ? "Loading schools..." : `${total} schools found`}</h3>
          </div>
          <span className="status-pill status-pill-live">Live API</span>
        </div>

        {error ? <div className="empty-state">{error}</div> : null}

        {!error && !isLoading && schools.length === 0 ? (
          <div className="empty-state">No schools matched the current query.</div>
        ) : null}

        {!error && !isLoading && schools.length > 0 && filteredSchools.length === 0 ? (
          <div className="empty-state">No schools matched the selected filters on this page.</div>
        ) : null}

        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>School</th>
                <th>Location</th>
                <th>Conference</th>
                <th>Tier</th>
                <th>Website</th>
                <th>Coaches</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSchools.map((school) => (
                <tr key={school.id || school._id}>
                  <td>
                    <div className="table-primary">
                      <strong>{school.name}</strong>
                      <span>{school.slug || school.externalId || school._id}</span>
                    </div>
                  </td>
                  <td>
                    <div className="table-primary">
                      <strong>
                        {school.city}, {school.state}
                      </strong>
                      <span>{school.division}</span>
                    </div>
                  </td>
                  <td>{school.conference || "Unassigned"}</td>
                  <td>{school.tier || "Unknown"}</td>
                  <td>
                    {school.website ? (
                      <a href={school.website} rel="noreferrer" target="_blank">
                        Open site
                      </a>
                    ) : (
                      "Missing"
                    )}
                  </td>
                  <td>{school.coachCount ?? 0}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="secondary-button"
                        onClick={() => handleStartEdit(school)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="secondary-button danger-button"
                        onClick={() => handleDeleteSchool(school)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!error && !isLoading && schools.length > 0 ? (
          <div className="pagination-bar">
            <div className="pagination-meta">
              <span>
                Showing {filteredSchools.length} of {schools.length} rows on this page · total {total}
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
