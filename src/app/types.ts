export interface PageNode {
  id: string;
  type: string;
  name: string;
  content: string;
  styles: Record<string, string>;
  children: PageNode[];
  customJs: string;
}

export interface CSSProperty {
  name: string;
  label: string;
  type: 'text' | 'color' | 'select' | 'range' | 'filter';
  options?: string[];
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export interface CSSCategory {
  category: string;
  properties: CSSProperty[];
}

export const CSS_SCHEMA: CSSCategory[] = [
  {
    category: 'Positioning',
    properties: [
      { name: 'position', label: 'Position', type: 'select', options: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
      { name: 'top', label: 'Top', type: 'text' },
      { name: 'right', label: 'Right', type: 'text' },
      { name: 'bottom', label: 'Bottom', type: 'text' },
      { name: 'left', label: 'Left', type: 'text' },
      { name: 'zIndex', label: 'Z-Index', type: 'text' },
    ]
  },
  {
    category: 'Sizing',
    properties: [
      { name: 'width', label: 'Width', type: 'text' },
      { name: 'height', label: 'Height', type: 'text' },
      { name: 'minWidth', label: 'Min Width', type: 'text' },
      { name: 'minHeight', label: 'Min Height', type: 'text' },
      { name: 'maxWidth', label: 'Max Width', type: 'text' },
      { name: 'maxHeight', label: 'Max Height', type: 'text' },
      { name: 'boxSizing', label: 'Box Sizing', type: 'select', options: ['content-box', 'border-box'] },
    ]
  },
  {
    category: 'Layout (Flex/Grid)',
    properties: [
      { name: 'display', label: 'Display', type: 'select', options: ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'inline-grid', 'none'] },
      { name: 'flexDirection', label: 'Flex Direction', type: 'select', options: ['row', 'row-reverse', 'column', 'column-reverse'] },
      { name: 'justifyContent', label: 'Justify Content', type: 'select', options: ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] },
      { name: 'alignItems', label: 'Align Items', type: 'select', options: ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'] },
      { name: 'flexWrap', label: 'Flex Wrap', type: 'select', options: ['nowrap', 'wrap', 'wrap-reverse'] },
      { name: 'gap', label: 'Gap', type: 'text' },
      { name: 'flex', label: 'Flex', type: 'text' },
      { name: 'flexGrow', label: 'Flex Grow', type: 'text' },
      { name: 'flexShrink', label: 'Flex Shrink', type: 'text' },
      { name: 'flexBasis', label: 'Flex Basis', type: 'text' },
      { name: 'gridTemplateColumns', label: 'Grid Columns', type: 'text' },
      { name: 'gridTemplateRows', label: 'Grid Rows', type: 'text' },
      { name: 'gridColumn', label: 'Grid Column', type: 'text' },
      { name: 'gridRow', label: 'Grid Row', type: 'text' },
    ]
  },
  {
    category: 'Spacing',
    properties: [
      { name: 'padding', label: 'Padding', type: 'text' },
      { name: 'paddingTop', label: 'Padding Top', type: 'text' },
      { name: 'paddingRight', label: 'Padding Right', type: 'text' },
      { name: 'paddingBottom', label: 'Padding Bottom', type: 'text' },
      { name: 'paddingLeft', label: 'Padding Left', type: 'text' },
      { name: 'margin', label: 'Margin', type: 'text' },
      { name: 'marginTop', label: 'Margin Top', type: 'text' },
      { name: 'marginRight', label: 'Margin Right', type: 'text' },
      { name: 'marginBottom', label: 'Margin Bottom', type: 'text' },
      { name: 'marginLeft', label: 'Margin Left', type: 'text' },
    ]
  },
  {
    category: 'Typography',
    properties: [
      { name: 'fontFamily', label: 'Font Family', type: 'text' },
      { name: 'fontSize', label: 'Font Size', type: 'text' },
      { name: 'fontWeight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
      { name: 'fontStyle', label: 'Font Style', type: 'select', options: ['normal', 'italic', 'oblique'] },
      { name: 'color', label: 'Text Color', type: 'color' },
      { name: 'textAlign', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
      { name: 'lineHeight', label: 'Line Height', type: 'text' },
      { name: 'letterSpacing', label: 'Letter Spacing', type: 'text' },
      { name: 'textDecoration', label: 'Text Decoration', type: 'select', options: ['none', 'underline', 'line-through', 'overline'] },
      { name: 'textTransform', label: 'Text Transform', type: 'select', options: ['none', 'capitalize', 'uppercase', 'lowercase'] },
      { name: 'whiteSpace', label: 'White Space', type: 'select', options: ['normal', 'nowrap', 'pre', 'pre-wrap', 'pre-line'] },
      { name: 'wordBreak', label: 'Word Break', type: 'select', options: ['normal', 'break-all', 'keep-all', 'break-word'] },
    ]
  },
  {
    category: 'Appearance',
    properties: [
      { name: 'backgroundColor', label: 'Background Color', type: 'color' },
      { name: 'backgroundImage', label: 'Background Image', type: 'text', placeholder: 'url(...) or linear-gradient(...)' },
      { name: 'backgroundSize', label: 'Background Size', type: 'text', placeholder: 'cover, contain, etc.' },
      { name: 'backgroundPosition', label: 'Background Position', type: 'text' },
      { name: 'backgroundRepeat', label: 'Background Repeat', type: 'select', options: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y'] },
      { name: 'borderRadius', label: 'Border Radius', type: 'range', min: 0, max: 100, step: 1, unit: 'px' },
      { name: 'border', label: 'Border', type: 'text' },
      { name: 'outline', label: 'Outline', type: 'text' },
      { name: 'boxShadow', label: 'Box Shadow', type: 'text' },
      { name: 'opacity', label: 'Opacity', type: 'range', min: 0, max: 1, step: 0.05, unit: '' },
      { name: 'overflow', label: 'Overflow', type: 'select', options: ['visible', 'hidden', 'scroll', 'auto'] },
      { name: 'overflowX', label: 'Overflow X', type: 'select', options: ['visible', 'hidden', 'scroll', 'auto'] },
      { name: 'overflowY', label: 'Overflow Y', type: 'select', options: ['visible', 'hidden', 'scroll', 'auto'] },
      { name: 'filter', label: 'Filter', type: 'filter' },
      { name: 'backdropFilter', label: 'Backdrop Filter', type: 'filter' },
      { name: 'cursor', label: 'Cursor', type: 'select', options: ['auto', 'default', 'pointer', 'text', 'move', 'not-allowed'] },
      { name: 'transition', label: 'Transition', type: 'text', placeholder: 'all 0.3s ease' },
      { name: 'transform', label: 'Transform', type: 'text', placeholder: 'scale(1.1) rotate(45deg)' },
      { name: 'objectFit', label: 'Object Fit', type: 'select', options: ['fill', 'contain', 'cover', 'none', 'scale-down'] },
    ]
  }
];
