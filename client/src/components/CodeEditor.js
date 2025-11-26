import React, { useRef, useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';
import './CodeEditor.css';

const CodeEditor = ({ value, onChange, onKeyDown, language = 'python' }) => {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const preRef = useRef(null);

  const getLanguageClass = () => {
    const langMap = {
      python: 'python',
      cpp: 'cpp',
      java: 'java'
    };
    return langMap[language] || 'python';
  };

  const getCommentSyntax = () => {
    return language === 'python' ? '#' : '//';
  };

  useEffect(() => {
    if (preRef.current) {
      // Remove existing highlighting classes
      preRef.current.className = `language-${getLanguageClass()}`;
      // Force re-highlight
      Prism.highlightElement(preRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, language]);

  const handleScroll = () => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleKeyDown = (e) => {
    // Call the parent's onKeyDown handler first if it exists
    if (onKeyDown) {
      onKeyDown(e);
    }

    // Handle Cmd+/ (Mac) or Ctrl+/ (Windows/Linux) for toggle comment
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;

      // Get the selected text
      const beforeSelection = value.substring(0, start);
      const selectedText = value.substring(start, end);
      const afterSelection = value.substring(end);

      // Find the start and end of the lines that contain the selection
      const startLine = beforeSelection.lastIndexOf('\n') + 1;
      const endLinePos = value.indexOf('\n', end);
      const endLine = endLinePos === -1 ? value.length : endLinePos;

      // Get the full lines that need to be toggled
      const linesToToggle = value.substring(startLine, endLine);
      const lines = linesToToggle.split('\n');

      // Check if all lines are commented
      const allCommented = lines.every(line => line.trim().startsWith('#') || line.trim() === '');

      let newLines;
      if (allCommented) {
        // Uncomment: Remove '# ' or '#' from the beginning of each line
        newLines = lines.map(line => {
          if (line.trim().startsWith('# ')) {
            return line.replace(/^(\s*)# /, '$1');
          } else if (line.trim().startsWith('#')) {
            return line.replace(/^(\s*)#/, '$1');
          }
          return line;
        });
      } else {
        // Comment: Add '# ' to the beginning of each non-empty line
        newLines = lines.map(line => {
          if (line.trim() === '') return line;
          const indent = line.match(/^\s*/)[0];
          return indent + '# ' + line.substring(indent.length);
        });
      }

      const newText = newLines.join('\n');
      const newValue = value.substring(0, startLine) + newText + value.substring(endLine);

      // Create synthetic event for onChange
      const syntheticEvent = {
        target: { value: newValue }
      };
      onChange(syntheticEvent);

      // Restore selection
      setTimeout(() => {
        if (textareaRef.current) {
          const lengthDiff = newText.length - linesToToggle.length;
          textareaRef.current.selectionStart = start;
          textareaRef.current.selectionEnd = end + lengthDiff;
          textareaRef.current.focus();
        }
      }, 0);
      return;
    }

    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newValue = value.substring(0, start) + '    ' + value.substring(end);
      
      // Create synthetic event for onChange
      const syntheticEvent = {
        target: { value: newValue }
      };
      onChange(syntheticEvent);

      // Set cursor position after the inserted spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
      return;
    }

    // Handle Enter key for auto-indentation
    if (e.key === 'Enter') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      // Get the current line
      const beforeCursor = value.substring(0, start);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Calculate current indentation
      const indentMatch = currentLine.match(/^\s*/);
      let currentIndent = indentMatch ? indentMatch[0] : '';
      
      // Check if the line ends with a colon (for Python function, class, if, etc.)
      const trimmedLine = currentLine.trim();
      const shouldIncreaseIndent = trimmedLine.endsWith(':');
      
      // Add extra indentation if needed
      const newIndent = shouldIncreaseIndent ? currentIndent + '    ' : currentIndent;
      
      // Insert newline with appropriate indentation
      const newValue = value.substring(0, start) + '\n' + newIndent + value.substring(end);
      
      // Create synthetic event for onChange
      const syntheticEvent = {
        target: { value: newValue }
      };
      onChange(syntheticEvent);

      // Set cursor position after the indentation
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + 1 + newIndent.length;
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = newPosition;
        }
      }, 0);
      return;
    }

    // Handle Backspace for smart dedent
    if (e.key === 'Backspace') {
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      
      // Only handle if no selection and cursor is not at the beginning
      if (start === end && start > 0) {
        const beforeCursor = value.substring(0, start);
        const lines = beforeCursor.split('\n');
        const currentLine = lines[lines.length - 1];
        
        // Check if we're at the start of indentation (only spaces before cursor on this line)
        if (currentLine.length > 0 && /^\s+$/.test(currentLine)) {
          // Check if we have 4 spaces (or a multiple of 4)
          const spacesToRemove = currentLine.length % 4 === 0 ? 4 : currentLine.length % 4;
          
          e.preventDefault();
          const newValue = value.substring(0, start - spacesToRemove) + value.substring(end);
          
          const syntheticEvent = {
            target: { value: newValue }
          };
          onChange(syntheticEvent);

          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start - spacesToRemove;
            }
          }, 0);
          return;
        }
      }
    }
  };

  return (
    <div className="code-editor-container">
      <pre 
        ref={highlightRef}
        className="code-highlight-layer"
        aria-hidden="true"
      >
        <code ref={preRef} className={`language-${getLanguageClass()}`}>
          {value + '\n'}
        </code>
      </pre>
      <textarea
        ref={textareaRef}
        className="code-input-layer"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        onScroll={handleScroll}
        placeholder="# Write your code here..."
        spellCheck="false"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
      />
    </div>
  );
};

export default CodeEditor;
