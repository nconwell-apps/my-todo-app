import React, { useState, useEffect } from 'react';
import { Plus, X, Check, Edit3, Save, Calendar, Flag } from 'lucide-react';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [filter, setFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  // Load todos from memory on component mount
  useEffect(() => {
    const savedTodos = JSON.parse(localStorage.getItem('todos') || '[]');
    setTodos(savedTodos);
  }, []);

  // Save todos to memory whenever todos change
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);

  // Play completion sound
  const playCompletionSound = () => {
    // Create a pleasant "ding" sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create a pleasant bell-like sound
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 border-red-500/30 text-red-300';
      case 'medium': return 'bg-teal-500/20 border-teal-500/30 text-teal-300';
      case 'low': return 'bg-green-500/20 border-green-500/30 text-green-300';
      default: return 'bg-teal-500/20 border-teal-500/30 text-teal-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal-400 mb-2">
            ✨ Todo Flow
          </h1>
          <p className="text-slate-400">Stay organized, stay productive</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-teal-400">{stats.total}</div>
            <div className="text-slate-400 text-sm">Total</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
            <div className="text-slate-400 text-sm">Completed</div>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-cyan-400">{stats.active}</div>
            <div className="text-slate-400 text-sm">Active</div>
          </div>
        </div>

        {/* Add Todo */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6 border border-slate-700">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="Add a new todo..."
              className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <button
              onClick={addTodo}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
            >
              <Plus size={20} />
              Add
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {['all', 'active', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                filter === f
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Todo List */}
        <div className="space-y-3">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <div className="text-6xl mb-4">🎯</div>
              <p className="text-xl mb-2">No todos found</p>
              <p>Add a new todo to get started!</p>
            </div>
          ) : (
            filteredTodos.map(todo => (
              <div
                key={todo.id}
                className={`bg-slate-800 border rounded-lg p-4 transition-all duration-200 hover:shadow-lg ${
                  todo.completed 
                    ? 'border-emerald-500/30 bg-emerald-950/20' 
                    : 'border-slate-700 hover:border-teal-500/50'
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                      todo.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-slate-500 hover:border-teal-400'
                    }`}
                  >
                    {todo.completed && <Check size={16} />}
                  </button>

                  {/* Todo Content */}
                  <div className="flex-1">
                    {editingId === todo.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && saveEdit()}
                          className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                          autoFocus
                        />
                        <button
                          onClick={saveEdit}
                          className="text-teal-400 hover:text-teal-300"
                        >
                          <Save size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex-1 ${
                            todo.completed
                              ? 'text-slate-400 line-through'
                              : 'text-white'
                          }`}
                        >
                          {todo.text}
                        </span>
                        
                        {/* Priority Badge */}
                        <select
                          value={todo.priority}
                          onChange={(e) => setPriority(todo.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(todo.priority)} bg-transparent cursor-pointer`}
                          disabled={todo.completed}
                        >
                          <option value="high" className="bg-slate-800">High</option>
                          <option value="medium" className="bg-slate-800">Medium</option>
                          <option value="low" className="bg-slate-800">Low</option>
                        </select>
                      </div>
                    )}
                    
                    {/* Date */}
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(todo.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  {!todo.completed && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(todo.id, todo.text)}
                        className="text-slate-400 hover:text-teal-400 transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500">
          <p>Built with React + Tailwind CSS</p>
          <p className="text-xs mt-1">Ready for deployment to Vercel + Supabase</p>
        </div>
      </div>
    </div>
  );
};

export default TodoApp;