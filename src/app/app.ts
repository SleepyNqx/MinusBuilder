import { ChangeDetectionStrategy, Component, signal, computed, HostListener } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PageNode, CSS_SCHEMA } from './types';
import { CanvasNodeComponent } from './canvas-node.component';
import { LayerNodeComponent } from './layer-node.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [MatIconModule, CanvasNodeComponent, LayerNodeComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  cssSchema = CSS_SCHEMA;
  
  rootNode = signal<PageNode>({
    id: 'root',
    type: 'div',
    name: 'Body',
    content: '',
    styles: {
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px'
    },
    children: [],
    customJs: ''
  });

  selectedIds = signal<string[]>([]);
  viewport = signal<'mobile' | 'tablet' | 'desktop'>('desktop');
  activeTab = signal<'styles' | 'script'>('styles');

  selectedNodes = computed(() => {
    const ids = this.selectedIds();
    const root = this.rootNode();
    return ids.map(id => this.findNode(root, id)).filter(n => n !== null) as PageNode[];
  });

  primarySelectedNode = computed(() => {
    const nodes = this.selectedNodes();
    return nodes.length > 0 ? nodes[0] : null;
  });

  // Dragging state
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  initialPositions = new Map<string, {top: number, left: number}>();
  initialRect: DOMRect | null = null;
  dragAnimationFrame: number | null = null;
  guides = signal<{type: 'vertical' | 'horizontal', position: number}[]>([]);

  // Resizing state
  isResizing = false;
  resizeStartX = 0;
  resizeStartY = 0;
  initialDimensions = new Map<string, {width: number, height: number}>();

  @HostListener('window:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.handleDragMove(event);
    } else if (this.isResizing) {
      this.handleResizeMove(event);
    }
  }

  handleDragMove(event: MouseEvent) {
    if (this.dragAnimationFrame) {
      cancelAnimationFrame(this.dragAnimationFrame);
    }

    this.dragAnimationFrame = requestAnimationFrame(() => {
      let deltaX = event.clientX - this.dragStartX;
      let deltaY = event.clientY - this.dragStartY;

      const newRoot = JSON.parse(JSON.stringify(this.rootNode()));
      const guidesToShow: {type: 'vertical' | 'horizontal', position: number}[] = [];

      const canvasContainer = document.getElementById('canvas-container');
      if (canvasContainer && this.selectedIds().length > 0 && this.initialRect) {
        const canvasRect = canvasContainer.getBoundingClientRect();
        const canvasCenterX = canvasRect.width / 2;
        const canvasCenterY = canvasRect.height / 2;

        const rect = this.initialRect;
        
        const newRectLeft = rect.left + deltaX - canvasRect.left;
        const newRectTop = rect.top + deltaY - canvasRect.top;
        const newRectRight = newRectLeft + rect.width;
        const newRectBottom = newRectTop + rect.height;
        const newCenterX = newRectLeft + rect.width / 2;
        const newCenterY = newRectTop + rect.height / 2;

        let snapX = false;
        let snapY = false;

        // Snap Center X
        if (Math.abs(newCenterX - canvasCenterX) < 10) {
          deltaX -= (newCenterX - canvasCenterX);
          snapX = true;
          guidesToShow.push({type: 'vertical', position: canvasCenterX});
        }
        // Snap Center Y
        if (Math.abs(newCenterY - canvasCenterY) < 10) {
          deltaY -= (newCenterY - canvasCenterY);
          snapY = true;
          guidesToShow.push({type: 'horizontal', position: canvasCenterY});
        }

        // Snap Edges
        if (!snapX) {
          if (Math.abs(newRectLeft - 0) < 10) {
            deltaX -= newRectLeft;
            guidesToShow.push({type: 'vertical', position: 0});
          } else if (Math.abs(newRectRight - canvasRect.width) < 10) {
            deltaX -= (newRectRight - canvasRect.width);
            guidesToShow.push({type: 'vertical', position: canvasRect.width});
          }
        }

        if (!snapY) {
          if (Math.abs(newRectTop - 0) < 10) {
            deltaY -= newRectTop;
            guidesToShow.push({type: 'horizontal', position: 0});
          } else if (Math.abs(newRectBottom - canvasRect.height) < 10) {
            deltaY -= (newRectBottom - canvasRect.height);
            guidesToShow.push({type: 'horizontal', position: canvasRect.height});
          }
        }
      }

      for (const id of this.selectedIds()) {
        const node = this.findNode(newRoot, id);
        if (node && node.id !== 'root') {
          const initialPos = this.initialPositions.get(id);
          if (initialPos) {
            node.styles['top'] = `${initialPos.top + deltaY}px`;
            node.styles['left'] = `${initialPos.left + deltaX}px`;
          }
        }
      }

      this.rootNode.set(newRoot);
      this.guides.set(guidesToShow);
    });
  }

  handleResizeMove(event: MouseEvent) {
    if (this.dragAnimationFrame) {
      cancelAnimationFrame(this.dragAnimationFrame);
    }

    this.dragAnimationFrame = requestAnimationFrame(() => {
      let deltaX = event.clientX - this.resizeStartX;
      let deltaY = event.clientY - this.resizeStartY;

      const newRoot = JSON.parse(JSON.stringify(this.rootNode()));

      for (const id of this.selectedIds()) {
        const node = this.findNode(newRoot, id);
        if (node && node.id !== 'root') {
          const initialDim = this.initialDimensions.get(id);
          if (initialDim) {
            const newWidth = Math.max(10, initialDim.width + deltaX);
            const newHeight = Math.max(10, initialDim.height + deltaY);
            node.styles['width'] = `${newWidth}px`;
            node.styles['height'] = `${newHeight}px`;
          }
        }
      }

      this.rootNode.set(newRoot);
    });
  }

  @HostListener('window:mouseup')
  onMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      this.guides.set([]);
      if (this.dragAnimationFrame) {
        cancelAnimationFrame(this.dragAnimationFrame);
        this.dragAnimationFrame = null;
      }
    }
    if (this.isResizing) {
      this.isResizing = false;
      if (this.dragAnimationFrame) {
        cancelAnimationFrame(this.dragAnimationFrame);
        this.dragAnimationFrame = null;
      }
    }
  }

  handleNodeMouseDown(payload: {event: MouseEvent, id: string}) {
    const {event, id} = payload;
    
    if (id === 'root') return;

    if (event.shiftKey) {
      const currentSelected = this.selectedIds();
      if (currentSelected.includes(id)) {
        this.selectedIds.set(currentSelected.filter(sid => sid !== id));
      } else {
        this.selectedIds.set([...currentSelected, id]);
      }
    } else {
      if (!this.selectedIds().includes(id)) {
        this.selectedIds.set([id]);
      }
    }

    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialPositions.clear();

    const root = this.rootNode();
    for (const selectedId of this.selectedIds()) {
      const node = this.findNode(root, selectedId);
      if (node) {
        const top = parseInt(node.styles['top'] || '0', 10);
        const left = parseInt(node.styles['left'] || '0', 10);
        this.initialPositions.set(selectedId, {top: isNaN(top) ? 0 : top, left: isNaN(left) ? 0 : left});
      }
    }

    const firstId = this.selectedIds()[0];
    const el = document.querySelector(`[data-node-id="${firstId}"]`);
    if (el) {
      this.initialRect = el.getBoundingClientRect();
    } else {
      this.initialRect = null;
    }
  }

  handleNodeResizeMouseDown(payload: {event: MouseEvent, id: string}) {
    const {event, id} = payload;
    
    if (id === 'root') return;

    if (!this.selectedIds().includes(id)) {
      this.selectedIds.set([id]);
    }

    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.initialDimensions.clear();

    const root = this.rootNode();
    for (const selectedId of this.selectedIds()) {
      const node = this.findNode(root, selectedId);
      if (node) {
        const el = document.querySelector(`[data-node-id="${selectedId}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          this.initialDimensions.set(selectedId, {width: rect.width, height: rect.height});
        }
      }
    }
  }

  handleNodeSelect(payload: {id: string, shift: boolean}) {
    const {id, shift} = payload;
    if (shift) {
      const current = this.selectedIds();
      if (current.includes(id)) {
        this.selectedIds.set(current.filter(x => x !== id));
      } else {
        this.selectedIds.set([...current, id]);
      }
    } else {
      this.selectedIds.set([id]);
    }
  }

  findNode(node: PageNode, id: string): PageNode | null {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = this.findNode(child, id);
      if (found) return found;
    }
    return null;
  }

  onDragStart(event: DragEvent, type: string) {
    if (event.dataTransfer) {
      event.dataTransfer.setData('type', type);
      event.dataTransfer.effectAllowed = 'copy';
    }
  }

  handleDropNode(event: {parentId: string, type: string, left?: number, top?: number}) {
    this.addNodeToParent(event.parentId, event.type, event.left, event.top);
  }

  addNodeToParent(parentId: string, type: string, left?: number, top?: number) {
    const newNode: PageNode = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      name: this.getDefaultName(type),
      content: this.getDefaultContent(type),
      styles: this.getDefaultStyles(type, left, top),
      children: [],
      customJs: ''
    };

    const newRoot = JSON.parse(JSON.stringify(this.rootNode()));
    const parent = this.findNode(newRoot, parentId);
    if (parent && ['div', 'section', 'ul', 'a'].includes(parent.type)) {
      parent.children.push(newNode);
      this.rootNode.set(newRoot);
      this.selectedIds.set([newNode.id]);
    }
  }

  getDefaultName(type: string): string {
    switch(type) {
      case 'div': return 'Container';
      case 'section': return 'Section';
      case 'text': return 'Paragraph';
      case 'span': return 'Inline Text';
      case 'h1': return 'Heading 1';
      case 'h2': return 'Heading 2';
      case 'h3': return 'Heading 3';
      case 'a': return 'Link';
      case 'button': return 'Button';
      case 'image': return 'Image';
      case 'video': return 'Video';
      case 'input': return 'Input Field';
      case 'textarea': return 'Text Area';
      case 'ul': return 'Unordered List';
      case 'li': return 'List Item';
      case 'iframe': return 'Iframe';
      default: return 'Element';
    }
  }

  getDefaultContent(type: string): string {
    switch(type) {
      case 'text': return 'Double click to edit text';
      case 'span': return 'Inline text';
      case 'h1': return 'Heading 1';
      case 'h2': return 'Heading 2';
      case 'h3': return 'Heading 3';
      case 'a': return 'Link text';
      case 'button': return 'Click Me';
      case 'image': return 'https://picsum.photos/seed/picsum/400/300';
      case 'video': return 'https://www.w3schools.com/html/mov_bbb.mp4';
      case 'iframe': return 'https://example.com';
      case 'li': return 'List item';
      default: return '';
    }
  }

  getDefaultStyles(type: string, left?: number, top?: number): Record<string, string> {
    const base = { position: 'absolute', top: top !== undefined ? `${top}px` : '20px', left: left !== undefined ? `${left}px` : '20px', zIndex: '1' };
    switch(type) {
      case 'div': return { ...base, width: '200px', height: '200px', backgroundColor: '#f3f4f6', borderRadius: '8px' };
      case 'section': return { ...base, width: '100%', minHeight: '300px', backgroundColor: '#ffffff' };
      case 'text': return { ...base, fontSize: '16px', color: '#1f2937', whiteSpace: 'normal' };
      case 'span': return { ...base, fontSize: '16px', color: '#1f2937', display: 'inline-block' };
      case 'h1': return { ...base, fontSize: '32px', fontWeight: 'bold', color: '#111827' };
      case 'h2': return { ...base, fontSize: '24px', fontWeight: 'bold', color: '#111827' };
      case 'h3': return { ...base, fontSize: '18px', fontWeight: 'bold', color: '#111827' };
      case 'a': return { ...base, fontSize: '16px', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' };
      case 'button': return { ...base, padding: '10px 20px', backgroundColor: '#3b82f6', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', border: 'none' };
      case 'image': return { ...base, width: '200px', height: '150px', borderRadius: '8px' };
      case 'video': return { ...base, width: '320px', height: '240px' };
      case 'input': return { ...base, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', width: '200px' };
      case 'textarea': return { ...base, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '4px', width: '250px', height: '100px' };
      case 'ul': return { ...base, paddingLeft: '20px', margin: '0' };
      case 'li': return { ...base, fontSize: '16px', color: '#1f2937' };
      case 'iframe': return { ...base, width: '400px', height: '300px', border: 'none' };
      default: return { ...base };
    }
  }

  updateSelectedStyle(prop: string, value: string) {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    const newRoot = JSON.parse(JSON.stringify(this.rootNode()));
    for (const id of ids) {
      const node = this.findNode(newRoot, id);
      if (node) {
        if (value) {
          node.styles[prop] = value;
        } else {
          delete node.styles[prop];
        }
      }
    }
    this.rootNode.set(newRoot);
  }

  updateSelectedContent(value: string) {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    const newRoot = JSON.parse(JSON.stringify(this.rootNode()));
    for (const id of ids) {
      const node = this.findNode(newRoot, id);
      if (node) {
        node.content = value;
      }
    }
    this.rootNode.set(newRoot);
  }

  updateSelectedJs(value: string) {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    const newRoot = JSON.parse(JSON.stringify(this.rootNode()));
    for (const id of ids) {
      const node = this.findNode(newRoot, id);
      if (node) {
        node.customJs = value;
      }
    }
    this.rootNode.set(newRoot);
  }

  getRangeValue(propName: string, unit: string): number {
    const val = this.primarySelectedNode()?.styles?.[propName] || '';
    if (!val) return 0;
    return parseFloat(val.replace(unit, ''));
  }

  getFilterType(propName: string): string {
    const val = this.primarySelectedNode()?.styles?.[propName] || '';
    if (!val) return '';
    return val.split('(')[0];
  }

  getFilterValue(propName: string): number {
    const val = this.primarySelectedNode()?.styles?.[propName] || '';
    if (!val) return 0;
    const match = val.match(/\(([^)]+)\)/);
    if (match) {
      return parseFloat(match[1]);
    }
    return 0;
  }

  getFilterMin(type: string): number {
    return 0;
  }

  getFilterMax(type: string): number {
    switch(type) {
      case 'blur': return 20;
      case 'hue-rotate': return 360;
      case 'brightness':
      case 'contrast':
      case 'saturate': return 200;
      default: return 100;
    }
  }

  getFilterStep(type: string): number {
    return type === 'blur' ? 0.5 : 1;
  }

  getFilterUnit(type: string): string {
    switch(type) {
      case 'blur': return 'px';
      case 'hue-rotate': return 'deg';
      default: return '%';
    }
  }

  updateFilter(propName: string, type: string, value: string) {
    if (!type) {
      this.updateSelectedStyle(propName, '');
      return;
    }
    const unit = this.getFilterUnit(type);
    this.updateSelectedStyle(propName, `${type}(${value}${unit})`);
  }

  deleteSelected() {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    const newRoot = JSON.parse(JSON.stringify(this.rootNode()));
    for (const id of ids) {
      if (id !== 'root') {
        this.removeNode(newRoot, id);
      }
    }
    this.rootNode.set(newRoot);
    this.selectedIds.set([]);
  }

  removeNode(parent: PageNode, idToRemove: string): boolean {
    const index = parent.children.findIndex(c => c.id === idToRemove);
    if (index !== -1) {
      parent.children.splice(index, 1);
      return true;
    }
    for (const child of parent.children) {
      if (this.removeNode(child, idToRemove)) return true;
    }
    return false;
  }

  bringToFront() {
    const newRoot = JSON.parse(JSON.stringify(this.rootNode()));
    let maxZ = 0;
    this.traverse(newRoot, (n) => {
       const z = parseInt(n.styles['zIndex'] || '0', 10);
       if (!isNaN(z) && z > maxZ) maxZ = z;
    });
    
    for (const id of this.selectedIds()) {
      const node = this.findNode(newRoot, id);
      if (node) {
        node.styles['zIndex'] = (maxZ + 1).toString();
      }
    }
    this.rootNode.set(newRoot);
  }

  sendToBack() {
    const newRoot = JSON.parse(JSON.stringify(this.rootNode()));
    let minZ = 0;
    this.traverse(newRoot, (n) => {
       const z = parseInt(n.styles['zIndex'] || '0', 10);
       if (!isNaN(z) && z < minZ) minZ = z;
    });
    
    for (const id of this.selectedIds()) {
      const node = this.findNode(newRoot, id);
      if (node) {
        node.styles['zIndex'] = (minZ - 1).toString();
      }
    }
    this.rootNode.set(newRoot);
  }

  traverse(node: PageNode, callback: (n: PageNode) => void) {
    callback(node);
    for (const child of node.children) {
      this.traverse(child, callback);
    }
  }

  exportProject() {
    const root = this.rootNode();
    let cssString = '';
    let jsString = '';

    const generateHtml = (node: PageNode): string => {
      const styleEntries = Object.entries(node.styles)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${v};`)
        .join(' ');
      
      cssString += `[data-id="${node.id}"] { ${styleEntries} }\n`;
      
      if (node.customJs) {
        jsString += `// Script for ${node.name} (${node.id})\n`;
        jsString += `document.querySelector('[data-id="${node.id}"]').addEventListener('click', function() {\n${node.customJs}\n});\n\n`;
      }

      const selfClosing = ['img', 'input', 'br', 'hr'];
      
      let tag = node.type;
      if (tag === 'text') tag = 'p';
      if (tag === 'image') tag = 'img';

      if (selfClosing.includes(tag)) {
        if (tag === 'img') {
          return `<img data-id="${node.id}" src="${node.content}" alt="${node.name}" />`;
        } else if (tag === 'input') {
          return `<input data-id="${node.id}" type="text" value="${node.content}" />`;
        }
      }

      let innerHtml = '';
      if (['p', 'span', 'h1', 'h2', 'h3', 'a', 'button', 'li', 'textarea'].includes(tag)) {
        innerHtml = node.content;
      } else if (tag === 'video') {
        innerHtml = `<source src="${node.content}" type="video/mp4">`;
      } else if (tag === 'iframe') {
        return `<iframe data-id="${node.id}" src="${node.content}"></iframe>`;
      } else {
        innerHtml = node.children.map(c => generateHtml(c)).join('\\n');
      }

      return `<${tag} data-id="${node.id}">${innerHtml}</${tag}>`;
    };

    const bodyHtml = generateHtml(root);

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Page</title>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, sans-serif; }
    * { box-sizing: border-box; }
${cssString}
  </style>
</head>
<body>
${bodyHtml}
  <script>
${jsString}
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported-page.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
