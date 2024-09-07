import React, { useState, useMemo, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const TextEditor = (props) => {
  const [editorValue, setEditorValue] = useState(props.value || '');
  const quillRef = useRef(null);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: '1' }, { header: '2' }, { header: '3' }, { font: [] }],
      [{ size: ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike', 'blockquote'],
      [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
      ['link'],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = useMemo(() => [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'blockquote',
    'list',
    'bullet',
    'indent',
    'link',
    'color',
    'background',
    'align',
    'clean',
  ], []);

  useEffect(() => {
    setEditorValue(props.value);
  }, [props.value]);

  const handleChange = (value) => {
    setEditorValue(value);
    if (props.onChange) {
      props.onChange(value);
    }
  };

  return (
    <div className="w-full flex justify-center items-center rounded-2xl">
      <div className="w-full">
        <ReactQuill
          ref={quillRef}
          value={editorValue}
          onChange={handleChange}
          modules={modules}
          formats={formats}
          theme="snow"
          className="bg-gray-50 border border-gray-300 shadow-sm rounded-2xl"
        />
      </div>
    </div>
  );
};

export default TextEditor;
