import React, { useState, useEffect } from 'react';

// Supabase Configuration
// REPLACE THESE WITH YOUR ACTUAL SUPABASE PROJECT VALUES
const SUPABASE_URL = 'https://lwzvagkpesqdvzrqdbje.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3enZhZ2twZXNxZHZ6cnFkYmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NTc2NDQsImV4cCI6MjA3MTMzMzY0NH0.XGtkDvrcW8apmaaaxeNZ6C97Ns7w1W5Hmviz6nA1nyw';

// Corrected SupabaseClient implementation
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
    this.auth = {
      user: null,
      session: null
    };
  }

  async signUp(email, password) {
    const response = await fetch(`${this.url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.key
      },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (data.user) {
      this.auth.user = data.user;
      this.auth.session = data.session;
    }
    return { data, error: data.error };
  }

 // Corrected signIn function in SupabaseClient
// Corrected signIn function in SupabaseClient
async signIn(email, password) {
  // Directly use the /auth/v1/token endpoint with grant_type=password
  const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'apikey': this.key
      },
      body: JSON.stringify({ email, password })
  });
  const data = await response.json();

  // If the token is successfully received, the API also sends user data.
  if (response.ok) {
      this.auth.user = data.user;
      this.auth.session = data; // Store the full response which contains the access_token
      return { data: { user: data.user, session: data }, error: null };
  } else {
      return { data: null, error: data.msg || 'Sign in failed.' };
  }
}

  async signOut() {
    this.auth.user = null;
    this.auth.session = null;
    return { error: null };
  }

  getUser() {
    return this.auth.user;
  }

  from(table) {
    return new SupabaseTable(this, table);
  }
}

class SupabaseTable {
  constructor(client, table) {
    this.client = client;
    this.table = table;
    this.selectFields = '*';
    this.whereConditions = [];
    this.orderBy = null;
  }

  select(fields = '*') {
    this.selectFields = fields;
    return this;
  }

  eq(column, value) {
    this.whereConditions.push(`${column}=eq.${value}`);
    return this;
  }

  order(column, ascending = true) {
    this.orderBy = `${column}.${ascending ? 'asc' : 'desc'}`;
    return this;
  }

  async insert(data) {
    const response = await fetch(`${this.client.url}/rest/v1/${this.table}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.client.key,
        'Authorization': `Bearer ${this.client.auth.session?.access_token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return { data: result, error: response.ok ? null : result };
  }

  async update(data) {
    let url = `${this.client.url}/rest/v1/${this.table}`;
    if (this.whereConditions.length > 0) {
      url += '?' + this.whereConditions.join('&');
    }
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.client.key,
        'Authorization': `Bearer ${this.client.auth.session?.access_token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    return { data: result, error: response.ok ? null : result };
  }

  async delete() {
    let url = `${this.client.url}/rest/v1/${this.table}`;
    if (this.whereConditions.length > 0) {
      url += '?' + this.whereConditions.join('&');
    }
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': this.client.key,
        'Authorization': `Bearer ${this.client.auth.session?.access_token}`
      }
    });
    return { error: response.ok ? null : await response.json() };
  }

  async fetch() {
    let url = `${this.client.url}/rest/v1/${this.table}?select=${this.selectFields}`;
    
    if (this.whereConditions.length > 0) {
      url += '&' + this.whereConditions.join('&');
    }
    
    if (this.orderBy) {
      url += `&order=${this.orderBy}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'apikey': this.client.key,
        'Authorization': `Bearer ${this.client.auth.session?.access_token}`
      }
    });
    const result = await response.json();
    return { data: result, error: response.ok ? null : result };
  }
}

// Initialize Supabase client
const supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TodoApp = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Styles
  const styles = {
    app: {
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      color: 'white'
    },
    container: {
      maxWidth: '768px',
      margin: '0 auto'
    },
    // Auth styles
    authContainer: {
      maxWidth: '400px',
      margin: '0 auto',
      marginTop: '10vh'
    },
    authCard: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '32px',
      textAlign: 'center'
    },
    authTitle: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#14b8a6',
      marginBottom: '8px'
    },
    authSubtitle: {
      color: '#64748b',
      marginBottom: '32px'
    },
    authForm: {
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    },
    authInput: {
      backgroundColor: '#334155',
      border: '1px solid #475569',
      borderRadius: '8px',
      padding: '12px 16px',
      color: 'white',
      fontSize: '1rem'
    },
    authButton: {
      backgroundColor: '#0d9488',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontWeight: '600',
      cursor: 'pointer',
      fontSize: '1rem',
      transition: 'background-color 0.2s ease'
    },
    authButtonDisabled: {
      backgroundColor: '#64748b',
      cursor: 'not-allowed'
    },
    authSwitch: {
      marginTop: '16px',
      color: '#64748b'
    },
    authLink: {
      color: '#14b8a6',
      cursor: 'pointer',
      textDecoration: 'underline'
    },
    authError: {
      color: '#ef4444',
      fontSize: '0.875rem',
      marginTop: '8px'
    },
    // App styles (existing)
    header: {
      textAlign: 'center',
      marginBottom: '32px',
      position: 'relative'
    },
    title: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: '#14b8a6',
      marginBottom: '8px',
      margin: '0 0 8px 0'
    },
    subtitle: {
      color: '#64748b',
      margin: 0
    },
    userInfo: {
      position: 'absolute',
      top: 0,
      right: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      color: '#64748b',
      fontSize: '0.875rem'
    },
    signOutButton: {
      backgroundColor: 'transparent',
      color: '#64748b',
      border: '1px solid #334155',
      borderRadius: '6px',
      padding: '6px 12px',
      cursor: 'pointer',
      fontSize: '0.875rem'
    },
    stats: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '24px'
    },
    statCard: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '16px',
      textAlign: 'center'
    },
    statNumber: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#14b8a6'
    },
    statCompleted: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#10b981'
    },
    statActive: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#06b6d4'
    },
    statLabel: {
      color: '#64748b',
      fontSize: '0.875rem',
      marginTop: '4px'
    },
    addTodo: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '24px',
      marginBottom: '24px'
    },
    inputGroup: {
      display: 'flex',
      gap: '12px'
    },
    todoInput: {
      flex: 1,
      backgroundColor: '#334155',
      border: '1px solid #475569',
      borderRadius: '8px',
      padding: '12px 16px',
      color: 'white',
      fontSize: '1rem'
    },
    addButton: {
      backgroundColor: '#0d9488',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '12px 24px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '1rem',
      transition: 'background-color 0.2s ease, transform 0.1s ease'
    },
    filters: {
      display: 'flex',
      gap: '8px',
      marginBottom: '24px'
    },
    filterButton: {
      backgroundColor: '#1e293b',
      color: '#cbd5e1',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '8px 16px',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    filterButtonActive: {
      backgroundColor: '#0d9488',
      color: 'white',
      border: '1px solid #0d9488',
      borderRadius: '8px',
      padding: '8px 16px',
      fontWeight: '500',
      cursor: 'pointer',
      fontSize: '1rem'
    },
    todoList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    todoItem: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '16px'
    },
    todoItemCompleted: {
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '8px',
      padding: '16px'
    },
    todoContent: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px'
    },
    checkbox: {
      width: '24px',
      height: '24px',
      border: '2px solid #64748b',
      borderRadius: '50%',
      background: 'transparent',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: '2px'
    },
    checkboxChecked: {
      width: '24px',
      height: '24px',
      border: '2px solid #10b981',
      borderRadius: '50%',
      backgroundColor: '#10b981',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: '2px'
    },
    todoTextSection: {
      flex: 1
    },
    todoMain: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '8px'
    },
    todoText: {
      flex: 1,
      fontSize: '1rem',
      color: 'white'
    },
    todoTextCompleted: {
      flex: 1,
      fontSize: '1rem',
      color: '#64748b',
      textDecoration: 'line-through'
    },
    priority: {
      backgroundColor: 'transparent',
      border: '1px solid rgba(20, 184, 166, 0.3)',
      borderRadius: '16px',
      padding: '4px 12px',
      fontSize: '0.75rem',
      fontWeight: '500',
      cursor: 'pointer',
      color: '#5eead4'
    },
    todoDate: {
      fontSize: '0.75rem',
      color: '#64748b',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    todoActions: {
      display: 'flex',
      gap: '8px'
    },
    actionButton: {
      background: 'none',
      border: 'none',
      color: '#64748b',
      cursor: 'pointer',
      padding: '4px',
      fontSize: '1rem'
    },
    emptyState: {
      textAlign: 'center',
      padding: '48px 20px',
      color: '#64748b'
    },
    emptyIcon: {
      fontSize: '4rem',
      marginBottom: '16px'
    },
    emptyTitle: {
      fontSize: '1.25rem',
      marginBottom: '8px',
      color: 'white'
    },
    emptySubtitle: {
      color: '#64748b'
    },
    footer: {
      textAlign: 'center',
      marginTop: '48px',
      color: '#64748b'
    },
    editGroup: {
      display: 'flex',
      gap: '8px',
      alignItems: 'center'
    },
    editInput: {
      flex: 1,
      backgroundColor: '#334155',
      border: '1px solid #475569',
      borderRadius: '6px',
      padding: '8px 12px',
      color: 'white',
      fontSize: '1rem'
    },
    loadingSpinner: {
      textAlign: 'center',
      padding: '50px',
      fontSize: '1.5rem'
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    // In a real app, you'd check for an existing session here
    setLoading(false);
  }, []);

  // Load todos when user is authenticated
  useEffect(() => {
    if (user) {
      loadTodos();
    }
  }, [user]);

  // Authentication functions
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const { data, error } = await supabase.signUp(email, password);
    
    if (error) {
      setAuthError(error.message || 'Sign up failed');
    } else {
      setUser(data.user);
    }
    
    setAuthLoading(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');

    const { data, error } = await supabase.signIn(email, password);
    
    if (error) {
      setAuthError(error.message || 'Sign in failed');
    } else {
      setUser(data.user);
    }
    
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.signOut();
    setUser(null);
    setTodos([]);
  };

  // Todo functions with Supabase integration
  const loadTodos = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', false);
    
    if (error) {
        console.error('Error fetching todos:', error); // Add this line
    }
    
    if (data && !error) {
      setTodos(data);
    }
  };

  const addTodo = async () => {
    if (newTodo.trim() && user) {
      const todo = {
        text: newTodo.trim(),
        completed: false,
        priority: 'medium',
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('todos')
        .insert([todo]);

      if (!error) {
        await loadTodos(); // Refresh the list
        setNewTodo('');
      }
    }
  };

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    const { error } = await supabase
      .from('todos')
      .update({ completed: !todo.completed })
      .eq('id', id);

    if (!error) {
      if (!todo.completed) {
        playCompletionSound();
      }
      await loadTodos();
    }
  };

  const deleteTodo = async (id) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (!error) {
      await loadTodos();
    }
  };

  const startEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = async () => {
    if (editText.trim()) {
      const { error } = await supabase
        .from('todos')
        .update({ text: editText.trim() })
        .eq('id', editingId);

      if (!error) {
        await loadTodos();
      }
    }
    setEditingId(null);
    setEditText('');
  };

  const setPriority = async (id, priority) => {
    const { error } = await supabase
      .from('todos')
      .update({ priority })
      .eq('id', id);

    if (!error) {
      await loadTodos();
    }
  };

  // Play completion sound
  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
  };

  const filteredTodos = todos.filter(todo => {
    switch (filter) {
      case 'active': return !todo.completed;
      case 'completed': return todo.completed;
      default: return true;
    }
  });

  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    active: todos.filter(t => !t.completed).length
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.app}>
        <div style={styles.loadingSpinner}>
          <div>🔄 Loading...</div>
        </div>
      </div>
    );
  }

  // Authentication screen
  if (!user) {
    return (
      <div style={styles.app}>
        <div style={styles.authContainer}>
          <div style={styles.authCard}>
            <h1 style={styles.authTitle}>🗃️ Todo Flow</h1>
            <p style={styles.authSubtitle}>
              {authMode === 'signin' ? 'Welcome back!' : 'Create your account'}
            </p>

            <div style={styles.authForm}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.authInput}
                onKeyPress={(e) => e.key === 'Enter' && (authMode === 'signin' ? handleSignIn(e) : handleSignUp(e))}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.authInput}
                onKeyPress={(e) => e.key === 'Enter' && (authMode === 'signin' ? handleSignIn(e) : handleSignUp(e))}
              />
              <button
                onClick={authMode === 'signin' ? handleSignIn : handleSignUp}
                disabled={authLoading}
                style={{
                  ...styles.authButton,
                  ...(authLoading ? styles.authButtonDisabled : {})
                }}
              >
                {authLoading ? 'Loading...' : (authMode === 'signin' ? 'Sign In' : 'Sign Up')}
              </button>
            </div>

            {authError && (
              <div style={styles.authError}>
                {authError}
              </div>
            )}

            <div style={styles.authSwitch}>
              {authMode === 'signin' ? (
                <span>
                  Don't have an account?{' '}
                  <span
                    style={styles.authLink}
                    onClick={() => setAuthMode('signup')}
                  >
                    Sign up
                  </span>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <span
                    style={styles.authLink}
                    onClick={() => setAuthMode('signin')}
                  >
                    Sign in
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main app (authenticated)
  return (
    <div style={styles.app}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.userInfo}>
            <span>💁‍♂️ {user.email}</span>
            <button onClick={handleSignOut} style={styles.signOutButton}>
              Sign Out
            </button>
          </div>
          <h1 style={styles.title}>
            🗃️ Todo Flow
          </h1>
          <p style={styles.subtitle}>Stay organized, stay productive</p>
        </div>

        {/* Stats */}
        <div style={styles.stats}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Total</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statCompleted}>{stats.completed}</div>
            <div style={styles.statLabel}>Completed</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statActive}>{stats.active}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>

        {/* Add Todo */}
        <div style={styles.addTodo}>
          <div style={styles.inputGroup}>
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new todo..."
              style={styles.todoInput}
            />
            <button 
              onClick={addTodo} 
              style={styles.addButton}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#0f766e';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#0d9488';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <span style={{fontSize: '1.25rem'}}>+</span>
              Add
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={filter === f ? styles.filterButtonActive : styles.filterButton}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div style={styles.todoList}>
          {filteredTodos.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎯</div>
              <p style={styles.emptyTitle}>No todos found</p>
              <p style={styles.emptySubtitle}>Add a new todo to get started!</p>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div
                key={todo.id}
                style={todo.completed ? styles.todoItemCompleted : styles.todoItem}
              >
                <div style={styles.todoContent}>
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    style={todo.completed ? styles.checkboxChecked : styles.checkbox}
                  >
                    {todo.completed && <span style={{color: 'white', fontWeight: 'bold', fontSize: '0.875rem'}}>✓</span>}
                  </button>

                  {/* Todo Text */}
                  <div style={styles.todoTextSection}>
                    {editingId === todo.id ? (
                      <div style={styles.editGroup}>
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                          style={styles.editInput}
                          autoFocus
                        />
                        <button onClick={saveEdit} style={styles.actionButton}>
                          💾
                        </button>
                      </div>
                    ) : (
                      <div style={styles.todoMain}>
                        <span style={todo.completed ? styles.todoTextCompleted : styles.todoText}>
                          {todo.text}
                        </span>
                        
                        {/* Priority */}
                        <select
                          value={todo.priority}
                          onChange={(e) => setPriority(todo.id, e.target.value)}
                          style={styles.priority}
                          disabled={todo.completed}
                        >
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                    )}
                    
                    {/* Date */}
                    <div style={styles.todoDate}>
                      📅 {new Date(todo.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={styles.todoActions}>
                    {!todo.completed && (
                      <button
                        onClick={() => startEdit(todo.id, todo.text)}
                        style={styles.actionButton}
                      >
                        ✏️
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      style={{...styles.actionButton, fontSize: '1.25rem', fontWeight: 'bold'}}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>Built with React + Supabase</p>
          <p style={{fontSize: '0.75rem', marginTop: '4px'}}>Built by nconwell 21/08/2025</p>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;