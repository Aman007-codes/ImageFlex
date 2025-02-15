import { useRef, useState, useEffect } from 'react';
import { EditableElement } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Type, 
  MoveVertical,
  MoveHorizontal,
  RotateCcw,
  Plus,
  Trash
} from 'lucide-react';

interface CanvasEditorProps {
  image: string;
  width: number;
  height: number;
  onSave: (elements: EditableElement[]) => void;
}

export function CanvasEditor({ image, width, height, onSave }: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [elements, setElements] = useState<EditableElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Load and draw background image
    const img = new Image();
    img.src = image;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      drawElements();
    };
  }, [image, width, height]);

  const drawElements = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas and redraw background
    const img = new Image();
    img.src = image;
    ctx.drawImage(img, 0, 0, width, height);

    // Draw all elements
    elements.forEach(element => {
      ctx.save();
      ctx.translate(element.x + element.width / 2, element.y + element.height / 2);
      ctx.rotate(element.rotation * Math.PI / 180);
      
      if (element.type === 'text') {
        ctx.font = `${element.fontSize}px ${element.fontFamily || 'Arial'}`;
        ctx.fillStyle = '#000000';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillText(element.content, 0, 0);
      }

      // Draw selection box if element is selected
      if (selectedElement?.id === element.id) {
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.strokeRect(
          -element.width / 2,
          -element.height / 2,
          element.width,
          element.height
        );
      }

      ctx.restore();
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on an element
    const clickedElement = elements.find(element => {
      return (
        x >= element.x &&
        x <= element.x + element.width &&
        y >= element.y &&
        y <= element.y + element.height
      );
    });

    if (clickedElement) {
      setSelectedElement(clickedElement);
      setIsDragging(true);
      setDragStart({ x, y });
    } else {
      setSelectedElement(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElement) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dx = x - dragStart.x;
    const dy = y - dragStart.y;

    setElements(elements.map(element =>
      element.id === selectedElement.id
        ? { ...element, x: element.x + dx, y: element.y + dy }
        : element
    ));

    setDragStart({ x, y });
    drawElements();
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const addTextElement = () => {
    const newElement: EditableElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'New Text',
      x: width / 2 - 50,
      y: height / 2 - 25,
      width: 100,
      height: 50,
      rotation: 0,
      fontSize: 24,
      fontFamily: 'Arial'
    };

    setElements([...elements, newElement]);
    setSelectedElement(newElement);
    drawElements();
  };

  const updateSelectedElement = (updates: Partial<EditableElement>) => {
    if (!selectedElement) return;

    setElements(elements.map(element =>
      element.id === selectedElement.id
        ? { ...element, ...updates }
        : element
    ));

    setSelectedElement({ ...selectedElement, ...updates });
    drawElements();
  };

  const deleteSelectedElement = () => {
    if (!selectedElement) return;

    setElements(elements.filter(element => element.id !== selectedElement.id));
    setSelectedElement(null);
    drawElements();
  };

  return (
    <div className="space-y-4">
      <div className="relative border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="cursor-move"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={addTextElement} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Text
        </Button>
        {selectedElement && (
          <Button
            variant="destructive"
            onClick={deleteSelectedElement}
            className="flex items-center gap-2"
          >
            <Trash className="w-4 h-4" />
            Delete
          </Button>
        )}
      </div>

      {selectedElement && selectedElement.type === 'text' && (
        <div className="space-y-4 p-4 border rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Text Content</label>
            <Input
              value={selectedElement.content}
              onChange={(e) => updateSelectedElement({ content: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Font Size</label>
            <Slider
              value={[selectedElement.fontSize || 24]}
              min={8}
              max={72}
              step={1}
              onValueChange={([value]) => updateSelectedElement({ fontSize: value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Rotation</label>
            <Slider
              value={[selectedElement.rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={([value]) => updateSelectedElement({ rotation: value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
