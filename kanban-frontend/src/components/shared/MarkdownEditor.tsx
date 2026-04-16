'use client';

import { useEffect, useMemo, useRef } from 'react';
import {
  Plate,
  PlateContent,
  usePlateEditor,
  useEditorRef,
  createPlateEditor,
} from '@udecode/plate/react';
import { MarkdownPlugin, serializeMd, deserializeMd } from '@udecode/plate-markdown';
import { BoldPlugin, ItalicPlugin, StrikethroughPlugin, CodePlugin } from '@udecode/plate-basic-marks/react';
import { HeadingPlugin } from '@udecode/plate-heading/react';
import { ListPlugin, BulletedListPlugin, NumberedListPlugin } from '@udecode/plate-list/react';
import { Bold, Italic, Strikethrough, Code, Heading1, Heading2, List, ListOrdered } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { cn } from '@/lib/utils/cn';

const PLUGINS = [
  MarkdownPlugin,
  BoldPlugin,
  ItalicPlugin,
  StrikethroughPlugin,
  CodePlugin,
  HeadingPlugin,
  ListPlugin,
  BulletedListPlugin,
  NumberedListPlugin,
];

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEditor = any;

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  className,
  readOnly = false,
}: MarkdownEditorProps) {
  const staticEditor: AnyEditor = useMemo(
    () => createPlateEditor({ plugins: PLUGINS }),
    [],
  );

  const initialValue = useMemo(() => {
    try {
      return deserializeMd(staticEditor, value || '');
    } catch {
      return [{ type: 'p', children: [{ text: value || '' }] }];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor: AnyEditor = usePlateEditor({ plugins: PLUGINS, value: initialValue });
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (!editor || value === prevValueRef.current) return;
    prevValueRef.current = value;
    try {
      const nodes = deserializeMd(editor, value || '');
      editor.tf.setValue(nodes);
    } catch {
      // ignore
    }
  }, [value, editor]);

  if (!editor) return null;

  function handleChange() {
    try {
      const md: string = serializeMd(editor);
      if (md !== prevValueRef.current) {
        prevValueRef.current = md;
        onChange(md);
      }
    } catch {
      // ignore
    }
  }

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      <Plate editor={editor} onChange={handleChange} readOnly={readOnly}>
        {!readOnly && <Toolbar />}
        <PlateContent
          placeholder={placeholder}
          className="min-h-[120px] p-3 text-sm focus:outline-none"
        />
      </Plate>
    </div>
  );
}

function Toolbar() {
  const editor: AnyEditor = useEditorRef();

  function isMarkActive(type: string): boolean {
    try {
      const marks = (editor.getMarks() as Record<string, unknown>) ?? {};
      return !!marks[type];
    } catch {
      return false;
    }
  }

  return (
    <div className="flex flex-wrap gap-0.5 border-b p-1 bg-muted/30">
      <Toggle
        size="sm"
        pressed={isMarkActive('bold')}
        onPressedChange={() => editor.tf.toggleMark('bold')}
        aria-label="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={isMarkActive('italic')}
        onPressedChange={() => editor.tf.toggleMark('italic')}
        aria-label="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={isMarkActive('strikethrough')}
        onPressedChange={() => editor.tf.toggleMark('strikethrough')}
        aria-label="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={isMarkActive('code')}
        onPressedChange={() => editor.tf.toggleMark('code')}
        aria-label="Inline code"
      >
        <Code className="h-3.5 w-3.5" />
      </Toggle>
      <div className="w-px bg-border mx-0.5" />
      <Toggle
        size="sm"
        onPressedChange={() => editor.tf.toggleBlock('h1')}
        aria-label="Heading 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        onPressedChange={() => editor.tf.toggleBlock('h2')}
        aria-label="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </Toggle>
      <div className="w-px bg-border mx-0.5" />
      <Toggle
        size="sm"
        onPressedChange={() => editor.tf.toggle.list({ type: 'ul' })}
        aria-label="Bulleted list"
      >
        <List className="h-3.5 w-3.5" />
      </Toggle>
      <Toggle
        size="sm"
        onPressedChange={() => editor.tf.toggle.list({ type: 'ol' })}
        aria-label="Numbered list"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </Toggle>
    </div>
  );
}
