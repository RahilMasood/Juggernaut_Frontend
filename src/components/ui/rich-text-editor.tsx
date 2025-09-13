"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Button } from "./button";
import { Label } from "./label";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  ImageIcon,
  Undo,
  Redo,
  FileText,
} from "lucide-react";
import { useState, useCallback } from "react";

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
}

export function RichTextEditor({
  content = "",
  onChange,
  placeholder = "Start typing...",
  label,
  id,
  className = "",
}: RichTextEditorProps) {
  const [showImageUrl, setShowImageUrl] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showLinkUrl, setShowLinkUrl] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange?.(html);
    },
  });

  const addImage = useCallback(() => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl("");
      setShowImageUrl(false);
    }
  }, [editor, imageUrl]);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      if (editor.state.selection.empty) {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${linkUrl}">${linkUrl}</a>`)
          .run();
      } else {
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl("");
      setShowLinkUrl(false);
    }
  }, [editor, linkUrl]);

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} className="mb-2 block">
          {label}
        </Label>
      )}

      <div className="rounded-md border border-gray-300">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-1 border-b border-gray-200 p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-gray-200" : ""}
          >
            <Bold className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-gray-200" : ""}
          >
            <Italic className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-gray-300" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-gray-200" : ""}
          >
            <List className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "bg-gray-200" : ""}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-gray-300" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowLinkUrl(!showLinkUrl)}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowImageUrl(!showImageUrl)}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-gray-300" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>

        {/* Link URL Input */}
        {showLinkUrl && (
          <div className="flex items-center gap-2 border-b border-gray-200 p-2">
            <input
              type="url"
              placeholder="Enter URL..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLink();
                }
              }}
            />
            <Button type="button" size="sm" onClick={addLink}>
              Add Link
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowLinkUrl(false)}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Image URL Input */}
        {showImageUrl && (
          <div className="flex items-center gap-2 border-b border-gray-200 p-2">
            <input
              type="url"
              placeholder="Enter image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addImage();
                }
              }}
            />
            <Button type="button" size="sm" onClick={addImage}>
              Add Image
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowImageUrl(false)}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Editor Content */}
        <div className="min-h-[120px] p-3">
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
