import React, { useState, useEffect, useMemo, useRef } from "react";
import type { Blog } from "../types";
import {
  fetchBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
} from "../api/todoApi";
import { marked } from "marked";
import {
  BookOpen,
  Plus,
  Search,
  Eye,
  Edit3,
  Columns,
  Trash2,
  CheckCircle,
  XCircle,
  Link,
  Save,
  ExternalLink,
} from "lucide-react";

export const BlogsWorkspace: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");

  // Local form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  // Debounced auto-save refs
  const saveTimeoutRef = useRef<any>(null);
  const isDirtyRef = useRef(false);

  // Load all blogs (drafts + published) on mount
  const loadBlogs = async () => {
    try {
      setLoading(true);
      const data = await fetchBlogs("all");
      setBlogs(data);
      if (data.length > 0) {
        handleSelectBlog(data[0]);
      } else {
        setSelectedBlog(null);
        clearForm();
      }
    } catch (err) {
      console.error("Failed to load blogs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const clearForm = () => {
    setTitle("");
    setSlug("");
    setContent("");
    setStatus("draft");
    isDirtyRef.current = false;
  };

  const handleSelectBlog = (blog: Blog) => {
    if (isDirtyRef.current && selectedBlog) {
      // Auto-save previous blog before switching
      performSave(selectedBlog.id, title, content, slug, status);
    }
    setSelectedBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setContent(blog.content);
    setStatus(blog.status);
    isDirtyRef.current = false;
  };

  const handleCreateBlog = async () => {
    try {
      setSaving(true);
      const newBlog = await createBlog("Untitled Article", "# Untitled\n\nStart writing in markdown...");
      setBlogs((prev) => [newBlog, ...prev]);
      handleSelectBlog(newBlog);
    } catch (err) {
      console.error("Failed to create blog:", err);
    } finally {
      setSaving(false);
    }
  };

  const performSave = async (
    id: number,
    t: string,
    c: string,
    s: string,
    st: "draft" | "published"
  ) => {
    try {
      setSaving(true);
      const updated = await updateBlog(id, {
        title: t,
        content: c,
        slug: s,
        status: st,
      });
      
      // Update local lists
      setBlogs((prev) => prev.map((b) => (b.id === id ? updated : b)));
      isDirtyRef.current = false;
    } catch (err) {
      console.error("Failed to save blog:", err);
    } finally {
      setSaving(false);
    }
  };

  // Trigger save manual
  const handleManualSave = () => {
    if (!selectedBlog) return;
    performSave(selectedBlog.id, title, content, slug, status);
  };

  // Trigger publish / unpublish
  const handlePublishToggle = async () => {
    if (!selectedBlog) return;
    try {
      setSaving(true);
      let updated: Blog;
      if (status === "published") {
        updated = await unpublishBlog(selectedBlog.id);
        setStatus("draft");
      } else {
        updated = await publishBlog(selectedBlog.id);
        setStatus("published");
      }
      setBlogs((prev) => prev.map((b) => (b.id === selectedBlog.id ? updated : b)));
      setSelectedBlog(updated);
      isDirtyRef.current = false;
    } catch (err) {
      console.error("Failed to toggle publish status:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlog = async () => {
    if (!selectedBlog) return;
    if (!confirm("Are you sure you want to permanently delete this blog post?")) return;
    try {
      setSaving(true);
      await deleteBlog(selectedBlog.id);
      const updatedList = blogs.filter((b) => b.id !== selectedBlog.id);
      setBlogs(updatedList);
      if (updatedList.length > 0) {
        handleSelectBlog(updatedList[0]);
      } else {
        setSelectedBlog(null);
        clearForm();
      }
    } catch (err) {
      console.error("Failed to delete blog:", err);
    } finally {
      setSaving(false);
    }
  };

  // Track changes for autosave
  const handleChange = (field: "title" | "content" | "slug", val: string) => {
    isDirtyRef.current = true;
    if (field === "title") setTitle(val);
    if (field === "content") setContent(val);
    if (field === "slug") setSlug(val);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (selectedBlog) {
      saveTimeoutRef.current = setTimeout(() => {
        if (isDirtyRef.current) {
          performSave(
            selectedBlog.id,
            field === "title" ? val : title,
            field === "content" ? val : content,
            field === "slug" ? val : slug,
            status
          );
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  // Filtered list
  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      return b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q);
    });
  }, [blogs, searchQuery]);

  // Markdown HTML content
  const previewHtml = useMemo(() => {
    try {
      return marked.parse(content || "") as string;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div className="notes-workspace-container">
      <div className="notes-grid-layout">
        
        {/* ── Left Sidebar: Blog list ── */}
        <div className="notes-sidebar">
          <div className="notes-search-wrapper">
            <Search size={14} className="search-icon-inside" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notes-search-input"
            />
          </div>

          <div 
            style={{ 
              padding: "12px 16px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center" 
            }}
          >
            <span style={{ fontSize: "0.72rem", color: "var(--clr-text-dim)", fontWeight: 600 }}>
              ARTICLES ({filteredBlogs.length})
            </span>
            <button className="btn btn-ghost btn-xs" onClick={handleCreateBlog} title="New Post">
              <Plus size={14} />
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--clr-text-dim)" }}>
              Loading...
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px", color: "var(--clr-text-dim)", fontSize: "0.8rem" }}>
              No articles found
            </div>
          ) : (
            <div className="notes-list" style={{ overflowY: "auto", flex: 1 }}>
              {filteredBlogs.map((blog) => {
                const isSelected = selectedBlog?.id === blog.id;
                const isPublished = blog.status === "published";
                return (
                  <button
                    key={blog.id}
                    className={`note-item ${isSelected ? "active" : ""}`}
                    onClick={() => handleSelectBlog(blog)}
                    style={{ width: "100%", padding: "12px 16px" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: "8px" }}>
                      <span className="note-item-title" style={{ textAlign: "left", flex: 1 }}>{blog.title}</span>
                      <span 
                        style={{ 
                          fontSize: "0.6rem", 
                          padding: "2px 6px", 
                          borderRadius: "4px", 
                          background: isPublished ? "rgba(16, 185, 129, 0.1)" : "rgba(255, 255, 255, 0.05)",
                          color: isPublished ? "#10b981" : "var(--clr-text-dim)",
                          fontWeight: 600
                        }}
                      >
                        {blog.status.toUpperCase()}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right Panel: Post Editor ── */}
        {selectedBlog ? (
          <div className="notes-editor-panel">
            
            {/* Header controls */}
            <div className="editor-header">
              
              {/* Workspace mode toggle */}
              <div className="mode-toggle-group">
                <button
                  className={`mode-btn ${viewMode === "edit" ? "active" : ""}`}
                  onClick={() => setViewMode("edit")}
                  title="Editor Only"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  className={`mode-btn ${viewMode === "split" ? "active" : ""}`}
                  onClick={() => setViewMode("split")}
                  title="Split Screen"
                >
                  <Columns size={13} />
                  <span>Split</span>
                </button>
                <button
                  className={`mode-btn ${viewMode === "preview" ? "active" : ""}`}
                  onClick={() => setViewMode("preview")}
                  title="Preview Only"
                >
                  <Eye size={13} />
                  <span>Preview</span>
                </button>
              </div>

              {/* Auto-saving status / Save Button */}
              <div className="saving-indicator-wrapper">
                <span className="saving-status">
                  {saving ? (
                    <span className="text-warning">Saving...</span>
                  ) : (
                    <span className="text-success">Saved</span>
                  )}
                </span>
              </div>

              {/* Actions group */}
              <div className="editor-actions">
                <button 
                  className={`btn btn-ghost btn-xs ${status === "published" ? "active" : ""}`}
                  onClick={handlePublishToggle}
                  style={{
                    color: status === "published" ? "#10b981" : "var(--clr-text)",
                    background: status === "published" ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    borderColor: status === "published" ? "rgba(16, 185, 129, 0.2)" : "transparent"
                  }}
                  title={status === "published" ? "Unpublish Post" : "Publish Post"}
                >
                  {status === "published" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                  <span>{status === "published" ? "Published" : "Publish"}</span>
                </button>

                {status === "published" && (
                  <a 
                    href={`https://blog.arumugamg.com/#${slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-ghost btn-xs"
                    title="View Published Post"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}

                <button 
                  className="btn btn-ghost btn-xs" 
                  onClick={handleManualSave}
                  title="Force Save"
                >
                  <Save size={14} />
                </button>

                <button 
                  className="btn btn-ghost btn-xs text-danger" 
                  onClick={handleDeleteBlog}
                  title="Delete Post"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {/* Title and custom slug inputs */}
            <div className="editor-title-container" style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px 20px 8px" }}>
              <input
                type="text"
                placeholder="Article Title..."
                value={title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="editor-title-input"
                style={{ fontSize: "1.4rem", fontWeight: 700 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Link size={12} className="text-dim" />
                <span style={{ fontSize: "0.75rem", color: "var(--clr-text-dim)", fontFamily: "var(--font-mono)" }}>
                  blog.arumugamg.com/#
                </span>
                <input
                  type="text"
                  placeholder="custom-slug"
                  value={slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className="notes-search-input"
                  style={{ 
                    borderBottom: "1px solid var(--clr-border)", 
                    padding: "2px 0", 
                    width: "auto",
                    flex: "0 1 200px",
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.75rem",
                    color: "var(--clr-accent)"
                  }}
                />
              </div>
            </div>

            {/* Split view workspace body */}
            <div className={`editor-body-wrapper mode-${viewMode}`}>
              {(viewMode === "edit" || viewMode === "split") && (
                <div className="editor-textarea-pane">
                  <textarea
                    value={content}
                    onChange={(e) => handleChange("content", e.target.value)}
                    placeholder="# Hello World&#10;&#10;Write your markdown content here. Supporting headers, code tags, lists, blockquotes, images, and mermaid diagrams.&#10;&#10;```mermaid&#10;graph TD&#10;  A[Start] --> B(Process)&#10;  B --> C[End]&#10;```"
                    className="editor-textarea"
                  />
                </div>
              )}

              {(viewMode === "preview" || viewMode === "split") && (
                <div className="editor-preview-pane">
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="notes-editor-panel" style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "var(--clr-text-dim)" }}>
              <BookOpen size={48} style={{ marginBottom: "16px", color: "var(--clr-border-hover)" }} />
              <h3>No Article Selected</h3>
              <p style={{ fontSize: "0.8rem", marginTop: "8px" }}>Create a new post or select an existing one to begin editing.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
