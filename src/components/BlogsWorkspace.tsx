import React, { useState, useEffect, useMemo, useRef } from "react";
import type { Blog } from "../types";
import {
  fetchBlogs,
  createBlog,
  updateBlog,
  deleteBlog,
  publishBlog,
  unpublishBlog,
  uploadMedia,
} from "../api/todoApi";
import { marked } from "marked";
import DOMPurify from "dompurify";
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
  ArrowLeft,
  ImagePlus,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { useSyncScroll } from "../hooks/useSyncScroll";

interface BlogsWorkspaceProps {
  onBackToDashboard?: () => void;
}

type SaveState = "idle" | "unsaved" | "saving" | "saved" | "error";

export const BlogsWorkspace: React.FC<BlogsWorkspaceProps> = ({ onBackToDashboard }) => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const { leftPaneRef, rightPaneRef, handleLeftScroll, handleRightScroll } = useSyncScroll();

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const clearForm = () => {
    setTitle("");
    setSlug("");
    setContent("");
    setStatus("draft");
    isDirtyRef.current = false;
    setSaveState("idle");
  };

  const applyBlogToForm = (blog: Blog) => {
    setSelectedBlog(blog);
    setTitle(blog.title);
    setSlug(blog.slug);
    setContent(blog.content);
    setStatus(blog.status);
    isDirtyRef.current = false;
    setSaveState("saved");
  };

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchBlogs("all");
      setBlogs(data);
      if (data.length > 0) {
        applyBlogToForm(data[0]);
      } else {
        setSelectedBlog(null);
        clearForm();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load blogs";
      setError(message === "UNAUTHORIZED" ? "Session expired. Please sign in again." : message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  const performSave = async (
    id: number,
    t: string,
    c: string,
    s: string,
    st: "draft" | "published",
  ) => {
    try {
      setSaveState("saving");
      setError(null);
      const updated = await updateBlog(id, {
        title: t,
        content: c,
        slug: s,
        status: st,
      });

      setBlogs((prev) => prev.map((b) => (b.id === id ? updated : b)));
      setSelectedBlog((prev) => (prev?.id === id ? updated : prev));
      setSlug(updated.slug);
      setTitle(updated.title);
      setStatus(updated.status);
      isDirtyRef.current = false;
      setSaveState("saved");
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save blog";
      setError(message === "UNAUTHORIZED" ? "Session expired. Please sign in again." : message);
      setSaveState("error");
      return null;
    }
  };

  const handleSelectBlog = async (blog: Blog) => {
    if (isDirtyRef.current && selectedBlog) {
      await performSave(selectedBlog.id, title, content, slug, status);
    }
    applyBlogToForm(blog);
  };

  const handleCreateBlog = async () => {
    try {
      setSaveState("saving");
      setError(null);
      const newBlog = await createBlog(
        "Untitled Article",
        "# Untitled\n\nStart writing in markdown. Use **Media** to upload images to Cloudinary.\n",
      );
      setBlogs((prev) => [newBlog, ...prev]);
      applyBlogToForm(newBlog);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create blog";
      setError(message === "UNAUTHORIZED" ? "Session expired. Please sign in again." : message);
      setSaveState("error");
    }
  };

  const handleManualSave = () => {
    if (!selectedBlog) return;
    performSave(selectedBlog.id, title, content, slug, status);
  };

  const handlePublishToggle = async () => {
    if (!selectedBlog) return;
    try {
      if (isDirtyRef.current) {
        const saved = await performSave(selectedBlog.id, title, content, slug, status);
        if (!saved) return;
      }
      setSaveState("saving");
      setError(null);
      const updated =
        status === "published"
          ? await unpublishBlog(selectedBlog.id)
          : await publishBlog(selectedBlog.id);
      setStatus(updated.status);
      setBlogs((prev) => prev.map((b) => (b.id === selectedBlog.id ? updated : b)));
      setSelectedBlog(updated);
      isDirtyRef.current = false;
      setSaveState("saved");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update publish status";
      setError(message === "UNAUTHORIZED" ? "Session expired. Please sign in again." : message);
      setSaveState("error");
    }
  };

  const handleDeleteBlog = async () => {
    if (!selectedBlog) return;
    if (!confirm("Are you sure you want to permanently delete this blog post?")) return;
    try {
      setSaveState("saving");
      setError(null);
      await deleteBlog(selectedBlog.id);
      const updatedList = blogs.filter((b) => b.id !== selectedBlog.id);
      setBlogs(updatedList);
      if (updatedList.length > 0) {
        applyBlogToForm(updatedList[0]);
      } else {
        setSelectedBlog(null);
        clearForm();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete blog";
      setError(message === "UNAUTHORIZED" ? "Session expired. Please sign in again." : message);
      setSaveState("error");
    }
  };

  const handleMediaUpload = async (file: File) => {
    if (!selectedBlog) return;
    try {
      setUploading(true);
      setError(null);
      const media = await uploadMedia(file);
      const alt = file.name.replace(/\.[^.]+$/, "") || "image";
      const isImage = media.contentType.startsWith("image/");
      const snippet = isImage
        ? `\n![${alt}](${media.url})\n`
        : `\n[${media.filename}](${media.url})\n`;

      const el = textareaRef.current;
      const start = el?.selectionStart ?? content.length;
      const end = el?.selectionEnd ?? content.length;
      const nextContent = content.slice(0, start) + snippet + content.slice(end);
      setContent(nextContent);
      isDirtyRef.current = true;
      setSaveState("unsaved");

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (selectedBlog) {
          void performSave(selectedBlog.id, title, nextContent, slug, status);
        }
      }, 400);

      requestAnimationFrame(() => {
        if (!el) return;
        el.focus();
        const pos = start + snippet.length;
        el.setSelectionRange(pos, pos);
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Media upload failed";
      setError(
        message === "UNAUTHORIZED"
          ? "Session expired. Please sign in again."
          : message,
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleChange = (field: "title" | "content" | "slug", val: string) => {
    isDirtyRef.current = true;
    setSaveState("unsaved");
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
            status,
          );
        }
      }, 2000);
    }
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const filteredBlogs = useMemo(() => {
    return blogs.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      return b.title.toLowerCase().includes(q) || b.content.toLowerCase().includes(q);
    });
  }, [blogs, searchQuery]);

  const previewHtml = useMemo(() => {
    try {
      const rawHtml = marked.parse(content || "") as string;
      return DOMPurify.sanitize(rawHtml);
    } catch {
      return content;
    }
  }, [content]);

  const saveLabel =
    saveState === "saving"
      ? "Saving…"
      : saveState === "unsaved"
        ? "Unsaved"
        : saveState === "error"
          ? "Save failed"
          : saveState === "saved"
            ? "Saved"
            : "";

  return (
    <div className="notes-workspace-container blog-manager-workspace">
      <div className="workspace-header-row">
        {onBackToDashboard && (
          <button className="btn btn-ghost btn-sm back-btn" onClick={onBackToDashboard}>
            <ArrowLeft size={14} />
            <span>Dashboard Launcher</span>
          </button>
        )}
        <span className="workspace-badge">Blog Manager</span>
        <a
          href="https://blog.arumugamg.com/"
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-sm"
        >
          <ExternalLink size={14} />
          <span>Public Blog</span>
        </a>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={14} aria-hidden="true" />
          <span>{error}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setError(null)} aria-label="Dismiss error">
            Dismiss
          </button>
        </div>
      )}

      <div className="notes-grid-layout">
        <div className="notes-sidebar">
          <div className="notes-search-wrapper">
            <Search size={14} className="search-icon-inside" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="notes-search-input"
              aria-label="Search blog posts"
            />
          </div>

          <div className="blog-sidebar-toolbar">
            <span className="blog-sidebar-count">ARTICLES ({filteredBlogs.length})</span>
            <button
              className="btn btn-ghost btn-xs"
              onClick={handleCreateBlog}
              title="New Post"
              aria-label="Create new blog post"
            >
              <Plus size={14} />
            </button>
          </div>

          {loading ? (
            <div className="blog-sidebar-empty">Loading…</div>
          ) : filteredBlogs.length === 0 ? (
            <div className="blog-sidebar-empty">No articles found</div>
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
                    aria-current={isSelected ? "true" : undefined}
                  >
                    <div className="blog-nav-row">
                      <span className="note-item-title">{blog.title}</span>
                      <span className={`blog-status-pill ${isPublished ? "published" : "draft"}`}>
                        {blog.status}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {selectedBlog ? (
          <div className="notes-editor-panel">
            <div className="editor-header">
              <div className="mode-toggle-group" role="group" aria-label="Editor view mode">
                <button
                  className={`mode-btn ${viewMode === "edit" ? "active" : ""}`}
                  onClick={() => setViewMode("edit")}
                  aria-pressed={viewMode === "edit"}
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  className={`mode-btn ${viewMode === "split" ? "active" : ""}`}
                  onClick={() => setViewMode("split")}
                  aria-pressed={viewMode === "split"}
                >
                  <Columns size={13} />
                  <span>Split</span>
                </button>
                <button
                  className={`mode-btn ${viewMode === "preview" ? "active" : ""}`}
                  onClick={() => setViewMode("preview")}
                  aria-pressed={viewMode === "preview"}
                >
                  <Eye size={13} />
                  <span>Preview</span>
                </button>
              </div>

              <div className="saving-indicator-wrapper" aria-live="polite">
                <span className={`saving-status save-${saveState}`}>{saveLabel}</span>
              </div>

              <div className="editor-actions">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm,audio/*,application/pdf,.md,.txt"
                  className="sr-only"
                  aria-hidden="true"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleMediaUpload(file);
                  }}
                />
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Upload media to Cloudinary"
                  aria-label="Upload media"
                >
                  {uploading ? <Loader2 size={14} className="spin" /> : <ImagePlus size={14} />}
                  <span>{uploading ? "Uploading…" : "Media"}</span>
                </button>

                <button
                  className={`btn btn-ghost btn-xs ${status === "published" ? "active" : ""}`}
                  onClick={handlePublishToggle}
                  style={{
                    color: status === "published" ? "#10b981" : "var(--clr-text)",
                    background: status === "published" ? "rgba(16, 185, 129, 0.1)" : "transparent",
                    borderColor: status === "published" ? "rgba(16, 185, 129, 0.2)" : "transparent",
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
                    aria-label="View published post"
                  >
                    <ExternalLink size={14} />
                  </a>
                )}

                <button className="btn btn-ghost btn-xs" onClick={handleManualSave} title="Force Save">
                  <Save size={14} />
                </button>

                <button
                  className="btn btn-ghost btn-xs text-danger"
                  onClick={handleDeleteBlog}
                  title="Delete Post"
                  aria-label="Delete blog post"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            <div className="editor-title-container blog-title-block">
              <input
                type="text"
                placeholder="Article Title..."
                value={title}
                onChange={(e) => handleChange("title", e.target.value)}
                className="editor-title-input"
                aria-label="Blog title"
              />
              <div className="blog-slug-row">
                <Link size={12} className="text-dim" aria-hidden="true" />
                <span className="blog-slug-prefix">blog.arumugamg.com/#</span>
                <input
                  type="text"
                  placeholder="custom-slug"
                  value={slug}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  className="notes-search-input blog-slug-input"
                  aria-label="Blog slug"
                />
              </div>
            </div>

            <div className={`editor-body-wrapper mode-${viewMode}`}>
              {(viewMode === "edit" || viewMode === "split") && (
                <div className="editor-textarea-pane" ref={leftPaneRef as React.RefObject<HTMLDivElement>} onScroll={handleLeftScroll}>
                  <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={(e) => handleChange("content", e.target.value)}
                    placeholder="# Hello World&#10;&#10;Write markdown here. Use Media to upload images to Cloudinary.&#10;&#10;```mermaid&#10;graph TD&#10;  A[Start] --> B(Process)&#10;  B --> C[End]&#10;```"
                    className="editor-textarea"
                    aria-label="Blog markdown content"
                  />
                </div>
              )}

              {(viewMode === "preview" || viewMode === "split") && (
                <div className="editor-preview-pane markdown-body" ref={rightPaneRef as React.RefObject<HTMLDivElement>} onScroll={handleRightScroll}>
                  <div
                    className="markdown-body"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="notes-editor-panel blog-empty-panel">
            <div className="blog-empty-state">
              <BookOpen size={48} aria-hidden="true" />
              <h3>No Article Selected</h3>
              <p>Create a new post or select an existing one to begin editing.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
