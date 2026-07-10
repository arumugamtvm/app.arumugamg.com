import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
  searchNotes,
  togglePinNote,
} from "../api/todoApi";
import type { Note } from "../types";
import {
  Plus,
  Trash2,
  FileText,
  ArrowLeft,
  Save,
  Pin,
  Search,
  Eye,
  Edit3,
  Columns,
  Sparkles,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { ErrorBanner } from "./ui/ErrorBanner";

interface NotesWorkspaceProps {
  onBackToDashboard: () => void;
}

export const NotesWorkspace: React.FC<NotesWorkspaceProps> = ({ onBackToDashboard }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split");
  
  // Auto-save status
  const [savingStatus, setSavingStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  
  // Keep refs for debouncing auto-save
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeNoteRef = useRef<Note | null>(null);

  // Sync activeNoteRef with state
  useEffect(() => {
    activeNoteRef.current = activeNote;
  }, [activeNote]);

  const selectNote = useCallback((note: Note) => {
    // If there was a pending auto-save, we trigger it immediately before switching
    if (autoSaveTimerRef.current && activeNoteRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      triggerSave(activeNoteRef.current.id, editTitle, editContent);
    }

    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsPinned(note.pinned === 1);
    setSavingStatus("saved");
  }, [editTitle, editContent]);

  const loadNotes = useCallback(async (query = "") => {
    setError(null);
    try {
      let data: Note[];
      if (query.trim()) {
        data = await searchNotes(query);
      } else {
        data = await fetchNotes();
      }
      setNotes(data);
      
      // Auto-select first note if none is active
      if (data.length > 0 && !activeNoteRef.current) {
        selectNote(data[0]);
      }
    } catch (err) {
      setError((err as Error).message || "Failed to load notes.");
    }
  }, [selectNote]);

  // Initial load and search debounce
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadNotes(searchQuery);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, loadNotes]);

  const handleCreateNote = async () => {
    setError(null);
    try {
      const newN = await createNote("Untitled Note", "");
      setNotes((prev) => [newN, ...prev]);
      selectNote(newN);
    } catch (err) {
      setError((err as Error).message || "Failed to create note.");
    }
  };

  const triggerSave = async (id: number, title: string, content: string) => {
    setSavingStatus("saving");
    try {
      const updated = await updateNote(id, { title, content });
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      if (activeNoteRef.current && activeNoteRef.current.id === updated.id) {
        setActiveNote(updated);
      }
      setSavingStatus("saved");
    } catch (err) {
      setSavingStatus("unsaved");
      setError((err as Error).message || "Failed to auto-save note.");
    }
  };

  // Debounced auto-save handler
  const handleContentChange = (content: string) => {
    setEditContent(content);
    setSavingStatus("unsaved");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (activeNote) {
      autoSaveTimerRef.current = setTimeout(() => {
        triggerSave(activeNote.id, editTitle, content);
      }, 1500); // Auto-save after 1.5 seconds of typing inactivity
    }
  };

  const handleTitleChange = (title: string) => {
    setEditTitle(title);
    setSavingStatus("unsaved");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    if (activeNote) {
      autoSaveTimerRef.current = setTimeout(() => {
        triggerSave(activeNote.id, title, editContent);
      }, 1500);
    }
  };

  // Manual save option
  const handleManualSave = async () => {
    if (!activeNote) return;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    await triggerSave(activeNote.id, editTitle, editContent);
  };

  const handleTogglePin = async () => {
    if (!activeNote) return;
    setError(null);
    try {
      const updated = await togglePinNote(activeNote.id);
      setIsPinned(updated.pinned === 1);
      
      // Update note in state
      setNotes((prev) => {
        const list = prev.map((n) => (n.id === updated.id ? updated : n));
        // Re-sort: pinned first, then updated_at DESC
        return [...list].sort((a, b) => {
          if (a.pinned !== b.pinned) return b.pinned - a.pinned;
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        });
      });
      setActiveNote(updated);
    } catch (err) {
      setError((err as Error).message || "Failed to toggle pin state.");
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note? This action cannot be undone.")) return;
    setError(null);
    
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    try {
      await deleteNote(id);
      const filtered = notes.filter((n) => n.id !== id);
      setNotes(filtered);
      
      if (activeNote?.id === id) {
        if (filtered.length > 0) {
          selectNote(filtered[0]);
        } else {
          setActiveNote(null);
          setEditTitle("");
          setEditContent("");
          setIsPinned(false);
        }
      }
    } catch (err) {
      setError((err as Error).message || "Failed to delete note.");
    }
  };

  const renderMarkdown = (md: string) => {
    try {
      // synchronous markdown parse and sanitize to prevent XSS
      const rawHtml = marked.parse(md || "_No content. Start typing markdown..._") as string;
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      return { __html: cleanHtml };
    } catch {
      return { __html: "Error parsing markdown" };
    }
  };

  // Split into pinned and other notes
  const pinnedNotes = notes.filter((n) => n.pinned === 1);
  const otherNotes = notes.filter((n) => n.pinned !== 1);

  return (
    <div className="notes-workspace-container">
      {/* Notion style workspace header */}
      <div className="workspace-header-row">
        {onBackToDashboard && (
          <button className="btn btn-ghost btn-sm back-btn" onClick={onBackToDashboard}>
            <ArrowLeft size={14} />
            <span>Dashboard Launcher</span>
          </button>
        )}
        <div className="saving-indicator-wrapper">
          {savingStatus === "saving" && (
            <span className="saving-status text-dim">
              <Loader2 size={12} className="animate-spin" /> Saving...
            </span>
          )}
          {savingStatus === "saved" && (
            <span className="saving-status text-success">
              <CheckCircle size={12} /> Saved to cloud
            </span>
          )}
          {savingStatus === "unsaved" && (
            <span className="saving-status text-warning">Unsaved changes</span>
          )}
        </div>
        <span className="workspace-badge">Notes Workspace</span>
      </div>

      <ErrorBanner message={error} />

      <div className="notes-grid-layout">
        {/* ── Left Sidebar: Notion-like list ── */}
        <div className="notes-sidebar">
          {/* Search bar */}
          <div className="notes-search-wrapper">
            <Search size={14} className="search-icon-inside" />
            <input
              type="text"
              className="notes-search-input"
              placeholder="Search title, content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sidebar-header">
            <h3>Documents</h3>
            <button className="btn btn-primary btn-icon btn-sm" onClick={handleCreateNote} title="New Document">
              <Plus size={15} />
            </button>
          </div>

          <div className="notes-list-scroll">
            {notes.length === 0 ? (
              <p className="no-items-text">No documents found.</p>
            ) : (
              <>
                {/* Pinned section */}
                {pinnedNotes.length > 0 && (
                  <div className="sidebar-section">
                    <span className="sidebar-section-title">
                      <Pin size={10} className="pin-title-icon" /> Pinned
                    </span>
                    {pinnedNotes.map((note) => (
                      <div
                        key={note.id}
                        className={`notes-list-item pinned ${activeNote?.id === note.id ? "active" : ""}`}
                        onClick={() => selectNote(note)}
                      >
                        <FileText size={14} className="note-item-icon" />
                        <div className="note-item-meta">
                          <span className="note-item-title">{note.title || "Untitled Document"}</span>
                          <span className="note-item-date">
                            {new Date(note.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* All / Others section */}
                <div className="sidebar-section">
                  {pinnedNotes.length > 0 && <span className="sidebar-section-title">Others</span>}
                  {otherNotes.map((note) => (
                    <div
                      key={note.id}
                      className={`notes-list-item ${activeNote?.id === note.id ? "active" : ""}`}
                      onClick={() => selectNote(note)}
                    >
                      <FileText size={14} className="note-item-icon" />
                      <div className="note-item-meta">
                        <span className="note-item-title">{note.title || "Untitled Document"}</span>
                        <span className="note-item-date">
                          {new Date(note.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Right Panel: Notion-like Editor ── */}
        <div className="notes-editor-panel">
          {activeNote ? (
            <div className="editor-container">
              {/* Tool bar & actions */}
              <div className="editor-header">
                {/* Mode Toggles */}
                <div className="mode-toggle-group">
                  <button
                    className={`mode-btn ${viewMode === "edit" ? "active" : ""}`}
                    onClick={() => setViewMode("edit")}
                    title="Write only"
                  >
                    <Edit3 size={13} />
                    <span>Write</span>
                  </button>
                  <button
                    className={`mode-btn ${viewMode === "preview" ? "active" : ""}`}
                    onClick={() => setViewMode("preview")}
                    title="Preview only"
                  >
                    <Eye size={13} />
                    <span>Preview</span>
                  </button>
                  <button
                    className={`mode-btn ${viewMode === "split" ? "active" : ""}`}
                    onClick={() => setViewMode("split")}
                    title="Split side-by-side"
                  >
                    <Columns size={13} />
                    <span>Split</span>
                  </button>
                </div>

                <div className="editor-actions">
                  <button
                    className={`btn btn-ghost btn-sm btn-icon pin-action-btn ${isPinned ? "is-pinned" : ""}`}
                    onClick={handleTogglePin}
                    title={isPinned ? "Unpin document" : "Pin document"}
                  >
                    <Pin size={14} />
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={handleManualSave} title="Save immediately">
                    <Save size={13} />
                    <span>Save</span>
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-icon hover-red"
                    onClick={() => handleDeleteNote(activeNote.id)}
                    title="Delete document"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {/* Title Section (always editable) */}
              <div className="editor-title-container">
                <input
                  type="text"
                  className="editor-title-input"
                  value={editTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Untitled Document"
                />
              </div>

              {/* Body workspace depending on mode */}
              <div className={`editor-body-wrapper mode-${viewMode}`}>
                {(viewMode === "edit" || viewMode === "split") && (
                  <div className="editor-textarea-pane">
                    <textarea
                      className="editor-textarea"
                      value={editContent}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Start writing in markdown syntax here... (e.g. # Header, **bold**, - list)"
                    />
                  </div>
                )}

                {(viewMode === "preview" || viewMode === "split") && (
                  <div className="editor-preview-pane markdown-body">
                    <div
                      dangerouslySetInnerHTML={renderMarkdown(editContent)}
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-active-note-box">
              <Sparkles size={40} className="decor-icon text-accent animate-pulse" />
              <h3>Welcome to your Creative Vault</h3>
              <p>Select a document from the sidebar or create a new one to begin editing with markdown styling.</p>
              <button className="btn btn-accent btn-sm mt-4" onClick={handleCreateNote}>
                <Plus size={14} /> Create a Document
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
