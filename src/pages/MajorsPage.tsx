import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createMajor, deleteMajor, getMajors, updateMajor } from "../api";
import { getErrorMessage } from "../lib/getErrorMessage";
import { Major, UpsertMajorPayload } from "../types/major";

function createMajorPayload(major?: Partial<Major>): UpsertMajorPayload {
  return {
    externalId: major?.externalId || "",
    name: major?.name || "",
    category: major?.category || "",
    isActive: major?.isActive ?? true,
  };
}

export function MajorsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [majors, setMajors] = useState<Major[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMajorId, setEditingMajorId] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [form, setForm] = useState<UpsertMajorPayload>(createMajorPayload());
  const [editForm, setEditForm] =
    useState<UpsertMajorPayload>(createMajorPayload());

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const result = await getMajors({ page, pageSize });
        if (!active) return;
        setMajors(result.items);
        setTotal(result.total);
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err, "Failed to load majors"));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [page, pageSize]);

  const categoryCounts = useMemo(() => {
    return majors.reduce<Record<string, number>>((acc, major) => {
      const key = major.category || "Uncategorized";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [majors]);
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(majors.map((major) => major.category).filter(Boolean)),
      ).sort(),
    [majors],
  );
  const filteredMajors = useMemo(
    () =>
      majors.filter((major) => {
        const matchesQuery =
          !query ||
          major.name.toLowerCase().includes(query.toLowerCase()) ||
          (major.externalId || "").toLowerCase().includes(query.toLowerCase());
        const matchesCategory =
          !selectedCategory || major.category === selectedCategory;
        const matchesStatus =
          !selectedStatus ||
          (selectedStatus === "active" ? major.isActive : !major.isActive);

        return matchesQuery && matchesCategory && matchesStatus;
      }),
    [majors, query, selectedCategory, selectedStatus],
  );

  const handleFormChange =
    (field: keyof UpsertMajorPayload) =>
    (
      event: ChangeEvent<HTMLInputElement>,
      target: "create" | "edit" = "create",
    ) => {
      const setter = target === "create" ? setForm : setEditForm;
      setter((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleCreateMajor = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsCreating(true);

    try {
      await createMajor(form);
      setNotice("Major created successfully.");
      setShowCreateForm(false);
      setForm(createMajorPayload());
      setPage(1);
      setIsLoading(true);
      const result = await getMajors({ page: 1, pageSize });
      setMajors(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create major"));
      setIsLoading(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartEdit = (major: Major) => {
    setEditingMajorId(major.id || major._id || null);
    setEditForm(createMajorPayload(major));
    setShowCreateForm(false);
    setNotice("");
    setError("");
  };

  const handleUpdateMajor = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingMajorId) return;

    setIsSavingEdit(true);
    setError("");
    setNotice("");

    try {
      await updateMajor(editingMajorId, editForm);
      setNotice("Major updated successfully.");
      setEditingMajorId(null);
      setIsLoading(true);
      const result = await getMajors({ page, pageSize });
      setMajors(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update major"));
    } finally {
      setIsSavingEdit(false);
      setIsLoading(false);
    }
  };

  const handleDeleteMajor = async (major: Major) => {
    const id = major.id || major._id;
    if (!id) return;

    setError("");
    setNotice("");

    try {
      await deleteMajor(id);
      setNotice(`${major.name} deleted successfully.`);
      setIsLoading(true);
      const result = await getMajors({ page, pageSize });
      setMajors(result.items);
      setTotal(result.total);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete major"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="page-header page-header-actions">
        <div>
          <p className="page-eyebrow">Majors</p>
          <h2 className="page-title">Canonical majors list</h2>
          <p className="page-copy">
            Standardize naming before records are linked to schools and future
            coach data.
          </p>
        </div>
        <div className="toolbar-actions">
          <button
            className="secondary-button"
            onClick={() => navigate("/imports?entity=majors")}
            type="button"
          >
            Import CSV
          </button>
          <button
            className="primary-button"
            onClick={() => setShowCreateForm((current) => !current)}
            type="button"
          >
            {showCreateForm ? "Close form" : "Add major"}
          </button>
        </div>
      </div>

      {notice ? <div className="notice-banner">{notice}</div> : null}

      {showCreateForm ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Create major</p>
              <h3>Add a canonical major</h3>
            </div>
          </div>

          <form
            className="form-grid form-grid-three"
            onSubmit={handleCreateMajor}
          >
            <label className="field">
              <span>Name</span>
              <input onChange={handleFormChange("name")} value={form.name} />
            </label>
            <label className="field">
              <span>External ID</span>
              <input
                onChange={handleFormChange("externalId")}
                value={form.externalId || ""}
              />
            </label>
            <label className="field">
              <span>Category</span>
              <input
                onChange={handleFormChange("category")}
                value={form.category || ""}
              />
            </label>
            <div className="field field-full">
              <button
                className="primary-button"
                disabled={isCreating}
                type="submit"
              >
                {isCreating ? "Creating..." : "Create major"}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {editingMajorId ? (
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Edit major</p>
              <h3>Update canonical major</h3>
            </div>
          </div>

          <form
            className="form-grid form-grid-three"
            onSubmit={handleUpdateMajor}
          >
            <label className="field">
              <span>Name</span>
              <input
                onChange={(event) => handleFormChange("name")(event, "edit")}
                value={editForm.name}
              />
            </label>
            <label className="field">
              <span>External ID</span>
              <input
                onChange={(event) =>
                  handleFormChange("externalId")(event, "edit")
                }
                value={editForm.externalId || ""}
              />
            </label>
            <label className="field">
              <span>Category</span>
              <input
                onChange={(event) =>
                  handleFormChange("category")(event, "edit")
                }
                value={editForm.category || ""}
              />
            </label>
            <div className="field field-full action-row">
              <button
                className="primary-button"
                disabled={isSavingEdit}
                type="submit"
              >
                {isSavingEdit ? "Saving..." : "Save changes"}
              </button>
              <button
                className="secondary-button"
                onClick={() => setEditingMajorId(null)}
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
            <h3>Search and segment majors</h3>
          </div>
        </div>
        <div className="form-grid form-grid-three">
          <label className="field">
            <span>Search</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              value={query}
            />
          </label>
          <label className="field">
            <span>Category</span>
            <select
              onChange={(event) => setSelectedCategory(event.target.value)}
              value={selectedCategory}
            >
              <option value="">All categories</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
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

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Major records</p>
              <h3>
                {isLoading ? "Loading majors..." : `${total} majors in library`}
              </h3>
            </div>
          </div>
          {error ? <div className="empty-state">{error}</div> : null}
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>External ID</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMajors.map((major) => (
                  <tr key={major.id || major._id}>
                    <td>{major.name}</td>
                    <td>
                      {major.externalId || major._id || "Generated later"}
                    </td>
                    <td>{major.category || "Uncategorized"}</td>
                    <td>
                      <span
                        className={`status-pill ${
                          major.isActive
                            ? "status-pill-live"
                            : "status-pill-muted"
                        }`}
                      >
                        {major.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="secondary-button"
                          onClick={() => handleStartEdit(major)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="secondary-button danger-button"
                          onClick={() => handleDeleteMajor(major)}
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
          {!error && !isLoading && majors.length > 0 ? (
            <div className="pagination-bar">
              <div className="pagination-meta">
                <span>
                  Showing {filteredMajors.length} of {majors.length} rows on
                  this page · total {total}
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
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </section>
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-eyebrow">Major families</p>
              <h3>Coverage by category</h3>
            </div>
          </div>
          <div className="stack-list">
            {Object.entries(categoryCounts).map(([category, count]) => (
              <article className="list-card" key={category}>
                <div>
                  <strong>{category}</strong>
                  <p>Canonical records ready for import matching</p>
                </div>
                <span className="status-pill">{count} majors</span>
              </article>
            ))}
            {!isLoading && !Object.keys(categoryCounts).length ? (
              <div className="empty-state">No major categories available.</div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
