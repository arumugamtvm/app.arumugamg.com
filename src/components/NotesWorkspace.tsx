import React, { useState, useEffect, useCallback } from "react";
import { fetchNotes, createNote, updateNote, deleteNote } from "../api/todoApi";
import type { Note } from "../types";
import { Plus, Trash2, Edit2, FileText, ArrowLeft, Save } from "lucide-react";

interface NotesWorkspaceProps {
  onBackToDashboard: () => void;
}

export const NotesWorkspace: React.FC<NotesWorkspaceProps> = ({ onBackToDashboard }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selectNote = useCallback((note: Note) => {
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
  }, []);

  const loadNotes = useCallback(async () => {
    setError(null);
    try {
      const data = await fetchNotes();
      setNotes(data);
      if (data.length > 0) {
        setActiveNote((current) => {
          if (!current) {
            setEditTitle(data[0].title);
            setEditContent(data[0].content);
            return data[0];
          }
          return current;
        });
      }
    } catch (err) {
      setError((err as Error).message || "Failed to load notes.");
    }
  }, []);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleCreateNote = async () => {
    setError(null);
    try {
      const newN = await createNote("Untitled Note", "Start writing your note here...");
      setNotes([newN, ...notes]);
      selectNote(newN);
    } catch (err) {
      setError((err as Error).message || "Failed to create note.");
    }
  };

  const handleSaveNote = async () => {
    if (!activeNote) return;
    setError(null);
    try {
      const updated = await updateNote(activeNote.id, editTitle, editContent);
      setNotes(notes.map((n) => (n.id === updated.id ? updated : n)));
      setActiveNote(updated);
      alert("Note saved successfully.");
    } catch (err) {
      setError((err as Error).message || "Failed to save note.");
    }
  };

  const handleDeleteNote = async (id: number) => {
    if (!confirm("Are you sure you want to delete this note?")) return;
    setError(null);
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
        }
      }
    } catch (err) {
      setError((err as Error).message || "Failed to delete note.");
    }
  };

  return (
    <div className="notes-workspace-container">
      {/* Back to Launcher Breadcrumb */}
      <div className="workspace-header-row">
        <button className="btn btn-ghost btn-sm back-btn" onClick={onBackToDashboard}>
          <ArrowLeft size={14} />
          <span>Dashboard Launcher</span>
        </button>
        <span className="workspace-badge">Notes Workspace</span>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}

      <div className="notes-grid-layout">
        {/* ── Left Sidebar: Notes list ── */}
        <div className="notes-sidebar">
          <div className="sidebar-header">
            <h3>Personal Notes</h3>
            <button className="btn btn-primary btn-icon btn-sm" onClick={handleCreateNote} title="New Note">
              <Plus size={16} />
            </button>
          </div>

          <div className="notes-list-scroll">
            {notes.length === 0 ? (
              <p className="no-items-text">No notes found. Click + to create one.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className={`notes-list-item ${activeNote?.id === note.id ? "active" : ""}`}
                  onClick={() => selectNote(note)}
                >
                  <FileText size={16} className="note-item-icon" />
                  <div className="note-item-meta">
                    <span className="note-item-title">{note.title || "Untitled Note"}</span>
                    <span className="note-item-date">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Right Panel: Note Editor ── */}
        <div className="notes-editor-panel">
          {activeNote ? (
            <div className="editor-container">
              <div className="editor-header">
                <input
                  type="text"
                  className="editor-title-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Note Title"
                />
                <div className="editor-actions">
                  <button className="btn btn-accent btn-sm" onClick={handleSaveNote}>
                    <Save size={14} />
                    <span>Save Note</span>
                  </button>
                  <button
                    className="btn btn-ghost btn-sm btn-icon hover-red"
                    onClick={() => handleDeleteNote(activeNote.id)}
                    title="Delete Note"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="editor-body">
                <textarea
                  className="editor-textarea"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Start writing markdown notes here..."
                />
              </div>
            </div>
          ) : (
            <div className="no-active-note-box">
              <Edit2 size={36} className="decor-icon" />
              <p>Select or create a note to begin writing securely.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
