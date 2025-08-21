import React, { useState, useEffect } from 'react';

const TodoApp = () => {
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
    header: {
      textAlign: 'center',
      marginBottom: '32px'
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
    }
  };

  // Load todos from localStorage on component mount
  useEffect(() => {
    const savedTodos = JSON.parse(localStorage.getItem('todos') || '[]');
    setTodos(savedTodos);
  }, []);

  // Save todos to localStorage whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Play completion sound
  const playCompletionSound = () => {
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
  };

  const addTodo = () => {
    if (newTodo.trim()) {
      const todo = {
        id: Date.now(),
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
        priority: 'medium'
      };
      setTodos([todo, ...todos]);
      setNewTodo('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        const updated = { ...todo, completed: !todo.completed };
        if (updated.completed) {
          playCompletionSound();
        }
        return updated;
      }
      return todo;
    }));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const startEdit = (id, text) => {
    setEditingId(id);
    setEditText(text);
  };

  const saveEdit = () => {
    if (editText.trim()) {
      setTodos(todos.map(todo => 
        todo.id === editingId 
          ? { ...todo, text: editText.trim() }
          : todo
      ));
    }
    setEditingId(null);
    setEditText('');
  };

  const setPriority = (id, priority) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, priority } : todo
    ));
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

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <h1 style={styles.title}>
            ✨ Todo Flow
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
                      📅 {new Date(todo.createdAt).toLocaleDateString()}
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
          <p>Built with React + CSS</p>
          <p style={{fontSize: '0.75rem', marginTop: '4px'}}>Built by nconwell 20/08/2025</p>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;