import React, { useState, useEffect, useRef } from 'react';
import searchService from '../../services/searchService';
import {
  Search,
  X,
  FileText,
  Tag,
  FolderTree,
  Loader2,
  Sparkles,
  CornerDownLeft
} from 'lucide-react';

const HighlightedText = ({ text = '', highlight = '' }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const cleanHighlight = highlight.trim().toLowerCase();
  const lowerText = text.toLowerCase();
  const startIndex = lowerText.indexOf(cleanHighlight);

  if (startIndex === -1) {
    return <span>{text}</span>;
  }

  const before = text.substring(0, startIndex);
  const match = text.substring(startIndex, startIndex + cleanHighlight.length);
  const after = text.substring(startIndex + cleanHighlight.length);

  return (
    <span>
      {before}
      <span className="font-extrabold text-indigo-600 dark:text-indigo-400 underline decoration-indigo-400/40">
        {match}
      </span>
      {after}
    </span>
  );
};

const getSuggestionIcon = (type) => {
  switch (type) {
    case 'tag':
      return <Tag className="h-3.5 w-3.5 text-emerald-500" />;
    case 'category':
    case 'subcategory':
      return <FolderTree className="h-3.5 w-3.5 text-amber-500" />;
    case 'filename':
    case 'word':
    default:
      return <FileText className="h-3.5 w-3.5 text-indigo-500" />;
  }
};

const SearchBar = ({
  searchQuery = '',
  onSearchChange,
  onSelectSuggestion,
  placeholder = 'Search files, tags, categories...'
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounced Trie query lookup
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery.trim() || searchQuery.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchService.getSuggestions(searchQuery, 8);
        if (res.success && res.suggestions) {
          setSuggestions(res.suggestions);
          setIsOpen(res.suggestions.length > 0);
          setSelectedIndex(-1);
        } else {
          setSuggestions([]);
          setIsOpen(false);
        }
      } catch (err) {
        console.error('Trie autocomplete failed:', err);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else {
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item) => {
    // Determine the query text to set
    const selectedText = item.type === 'tag' ? item.text : item.fileName || item.displayText;
    onSearchChange(selectedText);
    setIsOpen(false);
    if (onSelectSuggestion) {
      onSelectSuggestion(item);
    }
  };

  const handleClear = () => {
    onSearchChange('');
    setSuggestions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full sm:w-80">
      {/* Input Field */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400 dark:text-gray-500">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          id="dashboard-search-input"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full rounded-2xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-xs text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:bg-slate-900"
        />

        {searchQuery && (
          <button
            type="button"
            id="btn-clear-search"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Trie Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          id="trie-autocomplete-dropdown"
          className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200/90 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95"
        >
          {/* Dropdown Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-1.5 text-[10px] font-bold text-gray-400 dark:border-slate-800">
            <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-3 w-3" />
              Trie Autocomplete (O(L))
            </span>
            <span className="flex items-center gap-1 text-gray-400">
              <CornerDownLeft className="h-2.5 w-2.5" />
              Navigate
            </span>
          </div>

          {/* Suggestion Items */}
          <div className="mt-1 max-h-64 space-y-0.5 overflow-y-auto">
            {suggestions.map((item, idx) => {
              const isSelected = selectedIndex === idx;

              return (
                <div
                  key={`${item.type}-${item.text}-${idx}`}
                  id={`trie-suggestion-${idx}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-xs transition ${
                    isSelected
                      ? 'bg-indigo-50 text-indigo-900 dark:bg-indigo-950/80 dark:text-indigo-200'
                      : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-slate-800">
                      {getSuggestionIcon(item.type)}
                    </div>

                    <div className="truncate">
                      <p className="truncate font-medium">
                        <HighlightedText
                          text={item.type === 'tag' ? `#${item.displayText}` : item.displayText}
                          highlight={searchQuery}
                        />
                      </p>
                      {item.fileName && item.fileName !== item.displayText && (
                        <p className="truncate text-[10px] text-gray-400">
                          in {item.fileName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata pill */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {item.category && (
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[9px] font-semibold text-gray-500 dark:bg-slate-800 dark:text-gray-400">
                        {item.category}
                      </span>
                    )}
                    <span className="text-[9px] font-semibold uppercase text-indigo-500/80">
                      {item.type}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
