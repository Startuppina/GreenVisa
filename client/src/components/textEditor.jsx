import React, { useState, useRef, useEffect, useMemo } from 'react';
import JoditEditor from 'jodit-react';

const TextEditor = ({ value, onChange, placeholder }) => {
  const editor = useRef(null);
  const [content, setContent] = useState(value || '');

  // Configuration for JoditEditor
  const config = useMemo(() => ({
    readonly: false, // all options from https://xdsoft.net/jodit/docs/
    placeholder: placeholder || 'Start typing...',
  }), [placeholder]);

  useEffect(() => {
    // Update internal state when `value` prop changes
    setContent(value);
  }, [value]);

  const handleChange = (newContent) => {
    setContent(newContent);
    if (onChange) {
      onChange(newContent);
    }
  };

  return (
    <JoditEditor
      ref={editor}
      value={content}
      config={config}
      tabIndex={1} // tabIndex of textarea
      onBlur={handleChange} // update content when editor loses focus
      onChange={handleChange} // update content on change
    />
  );
};

export default TextEditor;
