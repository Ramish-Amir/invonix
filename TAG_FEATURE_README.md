# Takeoff Calculator Tagging Feature

## Overview

The takeoff calculator now includes a comprehensive tagging system that allows users to categorize and organize their measurements with custom tags.

## Features

### Tag Management

- **Create Custom Tags**: Users can create tags with custom names and colors
- **Pre-defined Tags**: The system comes with default tags (10mm, 20mm, 30mm) for immediate use
- **Color-coded Tags**: Each tag has a unique color for easy visual identification
- **Delete Tags**: Remove unused tags from the system

### Measurement Tagging

- **Automatic Tag Assignment**: New measurements are automatically assigned the currently selected tag
- **Visual Tag Indicators**:
  - Measurement lines are colored according to their assigned tag
  - Hover labels show tag indicators
  - Measurement list displays tag badges
- **Tag Modification**: Users can change or remove tags from existing measurements

### Measurement Pinning

- **Hover Labels**: Measurement values and tags are displayed when hovering over measurement lines
- **Click to Pin**: Click on any measurement line to pin its label permanently
- **Visual Indicators**: Pinned measurements have thicker lines and higher opacity
- **Pin Management**: Use the pin/unpin button in labels or the "Clear All Pins" button in the control menu
- **Persistent Display**: Pinned labels remain visible even when not hovering
- **Quick Tag Changes**: Click on the measurement value in pinned labels to change the tag directly
- **Quick Deletion**: Delete button appears in pinned labels for easy measurement removal

### Tag Selection

- **Active Tag Display**: The currently selected tag is highlighted in the tag selector
- **Tag Switching**: Click on any tag to make it the active tag for new measurements
- **No Tag Option**: Deselect all tags to create untagged measurements

### Summary and Analytics

- **Tag-based Grouping**: Measurements are automatically grouped by their assigned tags
- **Length Summaries**: View total length for each tag category
- **Overall Totals**: See the complete measurement summary across all tags

## Usage

### Creating a New Tag

1. Click the "Add Tag" button in the tag selector
2. Enter a tag name (e.g., "15mm", "Hot Water", "Cold Water")
3. Select a color from the color palette
4. Press Enter or click "Add"

### Assigning Tags to Measurements

1. Select a tag from the tag selector (it will be highlighted)
2. Draw new measurements - they will automatically use the selected tag
3. For existing measurements without tags, click on any tag badge to assign it
4. Click on an existing tag badge to remove the tag
5. **Quick Tag Changes**: Click on the measurement value in pinned labels to open a tag selector dropdown

### Managing Measurements

1. **Pin Measurements**: Click on measurement lines to pin their labels
2. **Change Tags**: Click measurement values in pinned labels to change tags
3. **Delete Measurements**: Use the trash icon in pinned labels to delete measurements
4. **Undo/Redo**: Use the undo/redo buttons in the control menu

### Viewing Tagged Measurements

- **Measurement Lines**: Colored according to their assigned tag
- **Measurement List**: Shows tag badges next to each measurement
- **Summary Section**: Groups measurements by tag with total lengths
- **Pinned Labels**: Click measurements to keep their labels visible permanently
- **Inline Tag Editing**: Click measurement values in pinned labels to change tags quickly
- **Quick Deletion**: Delete measurements directly from pinned labels with the trash icon

## Technical Implementation

### Components

- `TagSelector`: Manages tag creation, selection, and deletion
- `MeasurementList`: Displays measurements with tag management
- `MeasurementSummary`: Shows grouped measurements by tag
- `MeasurementOverlay`: Renders colored measurement lines with pin functionality
- `TakeoffControlMenu`: Includes pin management controls

### Data Structure

```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
}

interface Measurement {
  id: number;
  points: [Point, Point];
  pixelDistance: number;
  tag?: Tag;
}
```

### State Management

- Tags are stored in component state
- Selected tag determines the tag for new measurements
- Measurement tags are updated in real-time
- Tag changes are reflected immediately in the UI

## Benefits

- **Organization**: Categorize measurements by type, size, or purpose
- **Visual Clarity**: Color-coded measurements for easy identification
- **Analysis**: Group and summarize measurements by category
- **Flexibility**: Create custom tags for specific project needs
- **Efficiency**: Quick tag assignment and modification
