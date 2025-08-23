import React, { useState, useEffect } from 'react';

// Supabase Configuration
// REPLACE THESE WITH YOUR ACTUAL SUPABASE PROJECT VALUES
const SUPABASE_URL = 'https://lwzvagkpesqdvzrqdbje.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3enZhZ2twZXNxZHZ6cnFkYmplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3NTc2NDQsImV4cCI6MjA3MTMzMzY0NH0.XGtkDvrcW8apmaaaxeNZ6C97Ns7w1W5Hmviz6nA1nyw';

// SupabaseClient implementation (simplified for auth only)
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

  async signIn(email, password) {
    const response = await fetch(`${this.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.key
      },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();

    if (response.ok) {
      this.auth.user = data.user;
      this.auth.session = { access_token: data.access_token };
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

  // Simplified method for inserts only
  async insertTodo(todo) {
    const response = await fetch(`${this.url}/rest/v1/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.key,
        'Authorization': `Bearer ${this.auth.session?.access_token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(todo)
    });
    const result = await response.json();
    return { data: result, error: response.ok ? null : result };
  }

  async updateTodo(id, updates) {
    const response = await fetch(`${this.url}/rest/v1/todos?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.key,
        'Authorization': `Bearer ${this.auth.session?.access_token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });
    const result = await response.json();
    return { data: result, error: response.ok ? null : result };
  }

  async deleteTodo(id) {
    const response = await fetch(`${this.url}/rest/v1/todos?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.auth.session?.access_token}`
      }
    });
    return { error: response.ok ? null : await response.json() };
  }

  async getTodos(userId) {
    const response = await fetch(`${this.url}/rest/v1/todos?select=*&user_id=eq.${userId}&order=order.asc.nullsfirst,created_at.desc`, {
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.auth.session?.access_token}`
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
  const [authMode, setAuthMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [newTodoDueDate, setNewTodoDueDate] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [addingTodo, setAddingTodo] = useState(false);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Animation state
  const [completingItems, setCompletingItems] = useState(new Set());

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
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
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
      flexDirection: 'column',
      gap: '12px'
    },
    inputRow: {
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
    dateInput: {
      backgroundColor: '#334155',
      border: '1px solid #475569',
      borderRadius: '8px',
      padding: '12px 16px',
      color: 'white',
      fontSize: '1rem',
      minWidth: '150px'
    },
    addButton: {
      backgroundColor: '#0d9488',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '10px 20px',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      fontSize: '0.9rem',
      transition: 'background-color 0.2s ease, transform 0.1s ease',
      alignSelf: 'center',
      minWidth: '100px'
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
      padding: '16px',
      transition: 'all 0.2s ease'
    },
    todoItemCompleted: {
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '8px',
      padding: '16px',
      transition: 'all 0.2s ease'
    },
    todoItemDragging: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '16px',
      opacity: 0.5,
      transform: 'rotate(2deg)',
      cursor: 'grabbing',
      zIndex: 1000,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
    },
    todoItemCompletedDragging: {
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '8px',
      padding: '16px',
      opacity: 0.5,
      transform: 'rotate(2deg)',
      cursor: 'grabbing',
      zIndex: 1000,
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.3)'
    },
    todoItemDragOver: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '16px',
      borderTop: '3px solid #14b8a6',
      transform: 'translateY(4px)'
    },
    todoItemCompletedDragOver: {
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '8px',
      padding: '16px',
      borderTop: '3px solid #14b8a6',
      transform: 'translateY(4px)'
    },
    todoItemCompleting: {
      backgroundColor: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '8px',
      padding: '16px',
      transform: 'translateX(100%) scale(0.8)',
      opacity: 0,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      overflow: 'hidden'
    },
    todoContent: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px'
    },
    dragHandle: {
      cursor: 'grab',
      color: '#64748b',
      fontSize: '1.2rem',
      padding: '4px',
      userSelect: 'none',
      display: 'flex',
      alignItems: 'center'
    },
    dragHandleActive: {
      cursor: 'grabbing',
      color: '#14b8a6'
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
      gap: '4px',
      marginBottom: '4px'
    },
    todoDateDue: {
      fontSize: '0.75rem',
      color: '#f59e0b',
      display: 'flex',
      alignItems: 'center',
      gap: '4px'
    },
    todoDateOverdue: {
      fontSize: '0.75rem',
      color: '#ef4444',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontWeight: '600'
    },
    todoDateContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2px'
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
      flexDirection: 'column',
      gap: '8px'
    },
    editRow: {
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
    },
    spinner: {
      width: '16px',
      height: '16px',
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    },
  };

  // Add spinner animation
  const spinnerKeyframes = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;

  // Inject the keyframes into the document
  if (typeof document !== 'undefined' && !document.getElementById('spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = spinnerKeyframes;
    document.head.appendChild(style);
  }

  // Check for existing session on mount
  useEffect(() => {
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

  // Todo functions using direct fetch
  const loadTodos = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase.getTodos(user.id);
      
      if (!error) {
        setTodos(data);
      } else {
        console.error('Failed to load todos');
        setTodos([]);
      }
      
    } catch (error) {
      console.error('Error loading todos:', error);
      setTodos([]);
    }
  };

  // Helper function to check if date is overdue
  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  // Helper function to format date display
  const formatDateDisplay = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const addTodo = async () => {
    if (newTodo.trim() && user) {
      setAddingTodo(true);

      // Get the highest order value and add 1
      const maxOrder = todos.length > 0 ? Math.max(...todos.map(t => t.order || 0)) : 0;

      const todo = {
        text: newTodo.trim(),
        completed: false,
        priority: 'medium',
        user_id: user.id,
        created_at: new Date().toISOString(),
        due_date: newTodoDueDate || null,
        order: maxOrder + 1
      };

      const { data, error } = await supabase.insertTodo(todo);

      if (!error) {
        await loadTodos();
        setNewTodo('');
        setNewTodoDueDate('');
      }

      setAddingTodo(false);
    }
  };

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // If completing (not uncompleting), start the animation
    if (!todo.completed) {
      setCompletingItems(prev => new Set([...prev, id]));
      
      // Play completion sound immediately
      playCompletionSound();
      
      // Wait for animation to complete before updating database
      setTimeout(async () => {
        const { error } = await supabase.updateTodo(id, { completed: true });
        
        if (!error) {
          await loadTodos();
        }
        
        // Remove from completing items
        setCompletingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(id);
          return newSet;
        });
      }, 600); // Match the animation duration
      
    } else {
      // If uncompleting, update immediately without animation
      const { error } = await supabase.updateTodo(id, { completed: false });
      
      if (!error) {
        await loadTodos();
      }
    }
  };

  const deleteTodo = async (id) => {
    const { error } = await supabase.deleteTodo(id);
    if (!error) {
      await loadTodos();
    }
  };

  const startEdit = (id, text, dueDate) => {
    setEditingId(id);
    setEditText(text);
    setEditDueDate(dueDate || '');
  };

  const saveEdit = async () => {
    if (editText.trim()) {
      const { error } = await supabase.updateTodo(editingId, { 
        text: editText.trim(),
        due_date: editDueDate || null
      });
      if (!error) {
        await loadTodos();
      }
    }
    setEditingId(null);
    setEditText('');
    setEditDueDate('');
  };

  const setPriority = async (id, priority) => {
    const { error } = await supabase.updateTodo(id, { priority });
    if (!error) {
      await loadTodos();
    }
  };

  // Drag and drop functions
  const handleDragStart = (e, todo, index) => {
    setDraggedItem({ todo, index });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.dataTransfer.setDragImage(e.target, e.target.offsetWidth / 2, e.target.offsetHeight / 2);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedItem && draggedItem.index !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (!draggedItem || draggedItem.index === dropIndex) {
      setDraggedItem(null);
      return;
    }

    const newTodos = [...filteredTodos];
    const draggedTodo = newTodos[draggedItem.index];
    
    // Remove the dragged item
    newTodos.splice(draggedItem.index, 1);
    
    // Insert it at the new position
    newTodos.splice(dropIndex, 0, draggedTodo);
    
    // Update the order in the database
    await updateTodoOrder(newTodos);
    
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const updateTodoOrder = async (orderedTodos) => {
    try {
      // Update each todo with its new order
      const updatePromises = orderedTodos.map((todo, index) => 
        supabase.updateTodo(todo.id, { order: index })
      );
      
      await Promise.all(updatePromises);
      await loadTodos();
    } catch (error) {
      console.error('Failed to update todo order:', error);
    }
  };

  // Play completion sound
  const playCompletionSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // First quick swoosh
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      
      osc1.frequency.setValueAtTime(800, audioContext.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.15);
      gain1.gain.setValueAtTime(0.15, audioContext.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      osc1.type = 'sine';
      osc1.start(audioContext.currentTime);
      osc1.stop(audioContext.currentTime + 0.15);
      
      // Second slower swoosh
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.5);
      gain2.gain.setValueAtTime(0, audioContext.currentTime + 0.1);
      gain2.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      osc2.type = 'triangle';
      osc2.start(audioContext.currentTime + 0.1);
      osc2.stop(audioContext.currentTime + 0.5);
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
            <div style={styles.inputRow}>
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTodo()}
                placeholder="Add a new todo..."
                style={styles.todoInput}
              />
              <input
                type="date"
                value={newTodoDueDate}
                onChange={(e) => setNewTodoDueDate(e.target.value)}
                style={styles.dateInput}
                title="Due date (optional)"
              />
            </div>
            <button 
              onClick={addTodo} 
              disabled={addingTodo}
              style={{
              ...styles.addButton,
              ...(addingTodo ? { backgroundColor: '#64748b', cursor: 'not-allowed' } : {})
            }}
            onMouseEnter={(e) => {
              if (!addingTodo) {
                e.target.style.backgroundColor = '#0f766e';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!addingTodo) {
                e.target.style.backgroundColor = '#0d9488';
                e.target.style.transform = 'translateY(0)';
              }
            }}
            >
            {addingTodo ? (
              <>
                <div style={styles.spinner}></div>
                Adding...
              </>
            ) : (
              <>
                <span style={{fontSize: '1.1rem'}}>+</span>
                Add
              </>
            )}
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
            filteredTodos.map((todo, index) => {
              const isDragging = draggedItem && draggedItem.index === index;
              const isDragOver = dragOverIndex === index;
              const isCompleting = completingItems.has(todo.id);
              
              let itemStyle = todo.completed ? styles.todoItemCompleted : styles.todoItem;
              
              if (isCompleting) {
                itemStyle = styles.todoItemCompleting;
              } else if (isDragging) {
                itemStyle = todo.completed ? styles.todoItemCompletedDragging : styles.todoItemDragging;
              } else if (isDragOver) {
                itemStyle = todo.completed ? styles.todoItemCompletedDragOver : styles.todoItemDragOver;
              }
              
              return (
                <div
                  key={todo.id}
                  draggable={!isCompleting}
                  onDragStart={(e) => !isCompleting && handleDragStart(e, todo, index)}
                  onDragOver={(e) => !isCompleting && handleDragOver(e, index)}
                  onDragLeave={!isCompleting ? handleDragLeave : undefined}
                  onDrop={(e) => !isCompleting && handleDrop(e, index)}
                  onDragEnd={!isCompleting ? handleDragEnd : undefined}
                  style={itemStyle}
                >
                  <div style={styles.todoContent}>
                    {/* Drag Handle */}
                    <div 
                      style={isDragging ? styles.dragHandleActive : styles.dragHandle}
                      onMouseDown={() => {}}
                    >
                      ⋮⋮
                    </div>

                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      disabled={isCompleting}
                      style={{
                        ...(todo.completed ? styles.checkboxChecked : styles.checkbox),
                        ...(isCompleting ? { cursor: 'not-allowed', opacity: 0.7 } : {})
                      }}
                    >
                      {todo.completed && <span style={{color: 'white', fontWeight: 'bold', fontSize: '0.875rem'}}>✓</span>}
                      {isCompleting && !todo.completed && <span style={{color: '#14b8a6', fontWeight: 'bold', fontSize: '0.875rem'}}>✓</span>}
                    </button>

                    {/* Todo Text */}
                    <div style={styles.todoTextSection}>
                      {editingId === todo.id ? (
                        <div style={styles.editGroup}>
                          <div style={styles.editRow}>
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                              style={styles.editInput}
                              autoFocus
                              placeholder="Edit todo text"
                            />
                            <input
                              type="date"
                              value={editDueDate}
                              onChange={(e) => setEditDueDate(e.target.value)}
                              style={{...styles.editInput, minWidth: '140px'}}
                              title="Due date"
                            />
                            <button onClick={saveEdit} style={styles.actionButton}>
                              💾
                            </button>
                          </div>
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
                      
                      {/* Dates */}
                      <div style={styles.todoDateContainer}>
                        <div style={styles.todoDate}>
                          📅 Created: {formatDateDisplay(todo.created_at)}
                        </div>
                        {todo.due_date && (
                          <div style={
                            isOverdue(todo.due_date) && !todo.completed 
                              ? styles.todoDateOverdue 
                              : styles.todoDateDue
                          }>
                            ⏰ Due: {formatDateDisplay(todo.due_date)}
                            {isOverdue(todo.due_date) && !todo.completed && ' (OVERDUE)'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={styles.todoActions}>
                      {!todo.completed && (
                        <button
                          onClick={() => startEdit(todo.id, todo.text, todo.due_date)}
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
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p>Built with React + Supabase</p>
          <p style={{marginTop: '2px'}}>Version 1.0.3</p>
          <p style={{fontSize: '0.75rem', marginTop: '4px'}}>Built by nconwell 21/08/2025</p>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;