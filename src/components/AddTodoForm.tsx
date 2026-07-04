import React, { useState } from "react";
import { PlusCircle } from "lucide-react";

interface AddTodoFormProps {
  onAdd: (title: string, priority: "low" | "normal" | "high") => Promise<void>;
  loading: boolean;
}

export const AddTodoForm: React.FC<AddTodoFormProps> = ({ onAdd, loading }) => {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<"low" | "normal" | "high">("normal");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;
    
    await onAdd(title.trim(), priority);
    setTitle("");
    setPriority("normal");
  };

  return (
    <form className="add-todo-form" onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          type="text"
          className="todo-input"
          placeholder="Plan your next target..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          required
        />
        
        <select
          className="priority-select"
          value={priority}
          onChange={(e) => setPriority(e.target.value as "low" | "normal" | "high")}
          disabled={loading}
        >
          <option value="low">Low Priority</option>
          <option value="normal">Normal Priority</option>
          <option value="high">High Priority</option>
        </select>
        
        <button
          type="submit"
          className="btn btn-accent"
          disabled={loading || !title.trim()}
        >
          <PlusCircle size={16} />
          <span>Add</span>
        </button>
      </div>
    </form>
  );
};
