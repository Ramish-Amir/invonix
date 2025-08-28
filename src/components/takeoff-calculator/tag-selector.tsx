import React, { useState } from "react";
import { Plus, Tag, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";

export interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagSelectorProps {
  tags: Tag[];
  selectedTag: Tag | null;
  onTagSelect: (tag: Tag | null) => void;
  onTagCreate: (tag: Tag) => void;
  onTagDelete: (tagId: string) => void;
}

const defaultColors = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export const TagSelector: React.FC<TagSelectorProps> = ({
  tags,
  selectedTag,
  onTagSelect,
  onTagCreate,
  onTagDelete,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(defaultColors[0]);

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      const newTag: Tag = {
        id: Date.now().toString(),
        name: newTagName.trim(),
        color: newTagColor,
      };
      onTagCreate(newTag);
      setNewTagName("");
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateTag();
    } else if (e.key === "Escape") {
      setIsCreating(false);
      setNewTagName("");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Size Tags:</span>
      </div>

      {/* Existing tags */}
      {tags.map((tag) => (
        <Badge
          key={tag.id}
          variant={selectedTag?.id === tag.id ? "default" : "secondary"}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: selectedTag?.id === tag.id ? tag.color : undefined,
            borderColor: tag.color,
          }}
          onClick={() => onTagSelect(selectedTag?.id === tag.id ? null : tag)}
        >
          {tag.name}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTagDelete(tag.id);
            }}
            className="ml-1 hover:bg-black/20 rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      ))}

      {/* Create new tag button */}
      {!isCreating && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="h-6 px-2 text-xs"
        >
          <Plus className="w-3 h-3 mr-1" />
          Add Tag
        </Button>
      )}

      {/* Create new tag form */}
      {isCreating && (
        <div className="flex items-center gap-2 bg-background border rounded-md p-1">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Tag name..."
            className="h-6 w-20 text-xs border-0 focus-visible:ring-0"
            autoFocus
          />
          <div className="flex gap-1">
            {defaultColors.map((color) => (
              <button
                key={color}
                onClick={() => setNewTagColor(color)}
                className={`w-4 h-4 rounded-full border-2 ${
                  newTagColor === color ? "border-black" : "border-gray-300"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button
            size="sm"
            onClick={handleCreateTag}
            className="h-6 px-2 text-xs"
            disabled={!newTagName.trim()}
          >
            Add
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCreating(false);
              setNewTagName("");
            }}
            className="h-6 px-2 text-xs"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
