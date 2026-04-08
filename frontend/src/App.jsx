import React from 'react';
import { Show, SignInButton, SignUpButton, UserButton, useAuth, useUser } from '@clerk/react';
import NotesList from './components/NotesList';
import NoteForm from './components/NoteForm';
import './App.css';

function App() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const jwtTemplate = import.meta.env.VITE_CLERK_JWT_TEMPLATE;
  const [showForm, setShowForm] = React.useState(false);
  const [editingNote, setEditingNote] = React.useState(null);
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);

  const getApiToken = React.useCallback(async () => {
    if (jwtTemplate) {
      return getToken({ template: jwtTemplate });
    }
    return getToken();
  }, [getToken, jwtTemplate]);

  const handleNoteSubmit = () => {
    setShowForm(false);
    setEditingNote(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleEdit = (note) => {
    setEditingNote(note);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingNote(null);
  };

  if (!isSignedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h1>Switchboard Notes</h1>
          <p>A simple note-taking app</p>
          <div className="actions" style={{ justifyContent: 'center' }}>
            <Show when="signed-out">
              <SignInButton>
                <button className="login-btn">Sign In</button>
              </SignInButton>
              <SignUpButton>
                <button className="create-btn">Sign Up</button>
              </SignUpButton>
            </Show>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>My Notes</h1>
          <div className="user-info">
            <span className="username">Welcome, {user?.username || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'User'}</span>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="container">
          {!showForm && (
            <div className="actions">
              <button className="create-btn" onClick={() => setShowForm(true)}>
                + Create New Note
              </button>
            </div>
          )}

          {showForm && (
            <NoteForm
              getToken={getApiToken}
              note={editingNote}
              onSubmit={handleNoteSubmit}
              onCancel={handleCancel}
            />
          )}

          <NotesList getToken={getApiToken} onEdit={handleEdit} refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}

export default App;
