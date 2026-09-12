import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  Briefcase,
  Award,
  FileCheck,
  Newspaper,
  User,
  MoreVertical,
  Check,
  X,
  Layers
} from 'lucide-react';

const getCategoryIcon = (name) => {
  const lower = name.toLowerCase();
  if (lower.includes('study')) return <BookOpen className="h-4 w-4 text-sky-500" />;
  if (lower.includes('project')) return <Briefcase className="h-4 w-4 text-indigo-500" />;
  if (lower.includes('resume')) return <FileCheck className="h-4 w-4 text-emerald-500" />;
  if (lower.includes('certificate')) return <Award className="h-4 w-4 text-amber-500" />;
  if (lower.includes('news')) return <Newspaper className="h-4 w-4 text-rose-500" />;
  if (lower.includes('personal')) return <User className="h-4 w-4 text-purple-500" />;
  return <Folder className="h-4 w-4 text-slate-500" />;
};

const CategoryTree = ({
  tree = [],
  selectedCategory = 'All',
  selectedSubcategory = '',
  onSelectCategory,
  onSelectSubcategory,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  totalFiles = 0
}) => {
  // State for expanded nodes
  const [expandedNodes, setExpandedNodes] = useState({});

  // Auto-expand all parent nodes that have children when tree updates
  useEffect(() => {
    if (tree && tree.length > 0) {
      setExpandedNodes((prev) => {
        const next = { ...prev };
        tree.forEach((node) => {
          if (node.children && node.children.length > 0 && next[node._id] === undefined) {
            next[node._id] = true;
          }
        });
        return next;
      });
    }
  }, [tree]);

  // Modal / Inline states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editName, setEditName] = useState('');

  const toggleExpand = (nodeId, e) => {
    e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      setIsCreating(true);
      await onCreateCategory({
        name: newCatName.trim(),
        parentId: newCatParentId || null
      });
      setNewCatName('');
      setNewCatParentId('');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to create category:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleStartRename = (node, e) => {
    e.stopPropagation();
    setEditingNodeId(node._id);
    setEditName(node.name);
  };

  const handleSaveRename = async (nodeId, e) => {
    e.stopPropagation();
    if (!editName.trim()) {
      setEditingNodeId(null);
      return;
    }
    try {
      await onUpdateCategory(nodeId, editName.trim());
      setEditingNodeId(null);
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  const handleDelete = async (nodeId, e) => {
    e.stopPropagation();
    if (window.confirm('Delete this category? Files will be relocated to "Others".')) {
      try {
        await onDeleteCategory(nodeId);
      } catch (err) {
        console.error('Delete failed:', err);
      }
    }
  };

  return (
    <aside
      id="category-tree-sidebar"
      className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 px-2 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Categories (Tree)
          </span>
        </div>

        <button
          id="btn-add-category-open"
          onClick={() => {
            setNewCatParentId('');
            setIsAddModalOpen(true);
          }}
          title="Add New Category"
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 dark:border-slate-700 dark:text-gray-300 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Tree View */}
      <div className="mt-3 space-y-1 overflow-y-auto">
        {/* 'All Files' Root Option */}
        <div
          id="cat-item-all"
          onClick={() => {
            onSelectCategory('All');
            onSelectSubcategory('');
          }}
          className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition ${
            selectedCategory === 'All' && !selectedSubcategory
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <FolderOpen
              className={`h-4 w-4 ${
                selectedCategory === 'All' ? 'text-white' : 'text-indigo-500'
              }`}
            />
            <span>All Documents</span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              selectedCategory === 'All'
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'
            }`}
          >
            {totalFiles}
          </span>
        </div>

        {/* Tree Nodes */}
        {tree.map((node) => {
          const hasChildren = node.children && node.children.length > 0;
          const isExpanded = Boolean(expandedNodes[node._id]);
          const isSelected = selectedCategory === node.name && !selectedSubcategory;

          return (
            <div key={node._id} className="space-y-1">
              {/* Parent Category Row */}
              <div
                id={`cat-item-${node.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => {
                  onSelectCategory(node.name);
                  onSelectSubcategory('');
                }}
                className={`group flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-2 text-xs font-semibold transition ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {/* Chevron Toggle */}
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={(e) => toggleExpand(node._id, e)}
                      className={`p-0.5 rounded transition ${
                        isSelected
                          ? 'text-white hover:bg-white/20'
                          : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4" />
                  )}

                  {/* Icon */}
                  <span className={isSelected ? 'text-white' : ''}>
                    {getCategoryIcon(node.name)}
                  </span>

                  {/* Name or Rename input */}
                  {editingNodeId === node._id ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-6 w-24 rounded border border-indigo-400 px-1 text-xs text-gray-900 focus:outline-none dark:bg-slate-800 dark:text-white"
                        autoFocus
                      />
                      <button
                        onClick={(e) => handleSaveRename(node._id, e)}
                        className="text-emerald-500 hover:text-emerald-600"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNodeId(null);
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <span className="truncate">{node.name}</span>
                  )}
                </div>

                {/* Right side: Count & Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Custom category actions */}
                  {!node.isDefault && editingNodeId !== node._id && (
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleStartRename(node, e)}
                        title="Rename category"
                        className="p-1 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(node._id, e)}
                        title="Delete category"
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {/* Add Subcategory (+) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setNewCatParentId(node._id);
                      setIsAddModalOpen(true);
                    }}
                    title={`Add subcategory under ${node.name}`}
                    className={`hidden group-hover:flex p-1 rounded transition ${
                      isSelected
                        ? 'text-white/80 hover:text-white'
                        : 'text-gray-400 hover:text-indigo-600'
                    }`}
                  >
                    <Plus className="h-3 w-3" />
                  </button>

                  {/* File Count Badge */}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-300'
                    }`}
                  >
                    {node.fileCount || 0}
                  </span>
                </div>
              </div>

              {/* Subcategories (Children) */}
              {hasChildren && isExpanded && (
                <div className="ml-5 border-l-2 border-indigo-100 pl-2 space-y-1 dark:border-slate-800">
                  {node.children.map((child) => {
                    const isSubSelected =
                      selectedCategory === node.name && selectedSubcategory === child.name;

                    return (
                      <div
                        key={child._id}
                        id={`subcat-item-${child.name.toLowerCase().replace(/\s+/g, '-')}`}
                        onClick={() => {
                          onSelectCategory(node.name);
                          onSelectSubcategory(child.name);
                        }}
                        className={`group flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                          isSubSelected
                            ? 'bg-indigo-100 text-indigo-800 font-semibold dark:bg-indigo-950/80 dark:text-indigo-200'
                            : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                          {editingNodeId === child._id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="flex items-center gap-1"
                            >
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="h-5 w-20 rounded border border-indigo-400 px-1 text-xs text-gray-900 focus:outline-none dark:bg-slate-800 dark:text-white"
                                autoFocus
                              />
                              <button
                                onClick={(e) => handleSaveRename(child._id, e)}
                                className="text-emerald-500 hover:text-emerald-600"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingNodeId(null);
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <span className="truncate">{child.name}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!child.isDefault && editingNodeId !== child._id && (
                            <div className="hidden group-hover:flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={(e) => handleStartRename(child, e)}
                                title="Rename subcategory"
                                className="p-0.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                              >
                                <Edit2 className="h-2.5 w-2.5" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDelete(child._id, e)}
                                title="Delete subcategory"
                                className="p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          )}

                          <span
                            className={`rounded-full px-1.5 py-0.2 text-[9px] font-semibold ${
                              isSubSelected
                                ? 'bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100'
                                : 'bg-gray-100 text-gray-500 dark:bg-slate-800 dark:text-gray-400'
                            }`}
                          >
                            {child.fileCount || 0}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Category / Subcategory Modal via React Portal */}
      {isAddModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
            <div
              id="add-category-modal"
              className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-slate-800">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {newCatParentId ? 'Add Subcategory' : 'Add Root Category'}
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Parent Category
                  </label>
                  <select
                    value={newCatParentId}
                    onChange={(e) => setNewCatParentId(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                  >
                    <option value="" className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white">
                      None (Top-Level Category)
                    </option>
                    {tree.map((node) => (
                      <option
                        key={node._id}
                        value={node._id}
                        className="bg-white text-gray-900 dark:bg-slate-800 dark:text-white"
                      >
                        {node.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="input-category-name"
                    placeholder="e.g. Next.js, Financials, Travel"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-xs text-gray-900 transition focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:bg-slate-800"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-slate-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    id="btn-create-category-submit"
                    disabled={isCreating || !newCatName.trim()}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {isCreating ? 'Creating...' : 'Create Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </aside>
  );
};

export default CategoryTree;
