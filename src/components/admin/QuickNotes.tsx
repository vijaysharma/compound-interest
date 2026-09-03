import React, { useState, useEffect, useCallback } from 'react';
import { FiTrash2 } from 'react-icons/fi';
interface Note {
  id: string;
  content: string;
  created_at: string;
}
const QuickNotes: React.FC<{ token: string }> = ({ token }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin/notes', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotes(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    let active = true;
    const initialLoad = async () => {
      if (!token) {
        if (active) setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/notes', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (active) setNotes(data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    initialLoad();
    return () => {
      active = false;
    };
  }, [token]);
  const addNote = async () => {
    if (!newNote.trim() || !token) return;
    setBusy('add');
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newNote }),
      });
      if (res.ok) {
        setNewNote('');
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };
  const deleteNote = async (id: string) => {
    if (!token) return;
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/notes?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchNotes();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };
  return (
    <>
      <h2 className="card-title text-lg mb-4">Quick Notes</h2>
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          className="input input-bordered w-full"
          placeholder="Type a new note here..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addNote()}
        />
        <button
          className="btn btn-primary"
          onClick={addNote}
          disabled={busy === 'add' || !newNote.trim()}
        >
          {busy === 'add' ? 'Saving...' : 'Add Note'}
        </button>
      </div>
      {loading ? (
        <div className="text-center py-4">
          <span className="loading loading-spinner"></span>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8 text-base-content/50 italic">No notes found.</div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-3 bg-base-200 rounded-lg flex justify-between items-start gap-4 group"
            >
              <div className="whitespace-pre-wrap text-sm">{note.content}</div>
              <button
                onClick={() => deleteNote(note.id)}
                className="btn btn-ghost btn-xs text-error opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={busy === note.id}
                title="Delete Note"
              >
                <FiTrash2 />
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
};
export default QuickNotes;
