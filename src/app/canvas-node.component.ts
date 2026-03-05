import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { NgStyle } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PageNode } from './types';

@Component({
  selector: 'app-canvas-node',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div 
      [attr.data-node-id]="node.id"
      [ngStyle]="node.styles"
      [class.ring-1]="isSelected"
      [class.ring-blue-500]="isSelected"
      [class.hover:ring-1]="!isSelected"
      [class.hover:ring-zinc-400]="!isSelected"
      class="transition-none outline-none relative group"
      tabindex="0"
      (mousedown)="onMouseDown($event)"
      (click)="$event.stopPropagation()"
      (keydown.enter)="nodeSelect.emit({id: node.id, shift: false}); $event.stopPropagation()"
      (dragover)="onDragOver($event)"
      (drop)="onDrop($event); $event.stopPropagation()"
    >
      @if (node.type === 'text' || node.type === 'span' || node.type === 'h1' || node.type === 'h2' || node.type === 'h3' || node.type === 'a' || node.type === 'button' || node.type === 'li') {
        {{ node.content }}
      } @else if (node.type === 'image') {
        <img [src]="node.content" alt="Image" class="w-full h-full object-cover pointer-events-none" referrerpolicy="no-referrer" />
      } @else if (node.type === 'video') {
        <video class="w-full h-full object-cover pointer-events-none" controls>
          <source [src]="safeContentUrl" type="video/mp4">
        </video>
      } @else if (node.type === 'input') {
        <input type="text" [value]="node.content" class="w-full h-full pointer-events-none" />
      } @else if (node.type === 'textarea') {
        <textarea class="w-full h-full pointer-events-none">{{ node.content }}</textarea>
      } @else if (node.type === 'iframe') {
        <iframe [src]="safeContentUrl" class="w-full h-full pointer-events-none" frameborder="0"></iframe>
      } @else {
        @for (child of node.children; track child.id) {
          <app-canvas-node 
            [node]="child" 
            [selectedIds]="selectedIds"
            (nodeSelect)="nodeSelect.emit($event)"
            (nodeMouseDown)="nodeMouseDown.emit($event)"
            (nodeResizeMouseDown)="nodeResizeMouseDown.emit($event)"
            (dropNode)="dropNode.emit($event)"
          ></app-canvas-node>
        }
        @if (node.children.length === 0 && node.type === 'div') {
          <div class="absolute inset-0 flex items-center justify-center text-zinc-400 text-xs pointer-events-none opacity-50 min-h-[40px]">Drop here</div>
        }
      }

      @if (isSelected) {
        <div 
          class="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-blue-500 rounded-full cursor-se-resize z-50"
          (mousedown)="onResizeMouseDown($event)"
        ></div>
      }
    </div>
  `
})
export class CanvasNodeComponent {
  private sanitizer = inject(DomSanitizer);

  @Input() node!: PageNode;
  @Input() selectedIds: string[] = [];
  @Output() nodeSelect = new EventEmitter<{id: string, shift: boolean}>();
  @Output() nodeMouseDown = new EventEmitter<{event: MouseEvent, id: string}>();
  @Output() nodeResizeMouseDown = new EventEmitter<{event: MouseEvent, id: string}>();
  @Output() dropNode = new EventEmitter<{parentId: string, type: string, left?: number, top?: number}>();

  get isSelected() {
    return this.selectedIds.includes(this.node.id);
  }

  get safeContentUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.node.content);
  }

  onMouseDown(event: MouseEvent) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    event.preventDefault();
    event.stopPropagation();
    this.nodeMouseDown.emit({event, id: this.node.id});
  }

  onResizeMouseDown(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.nodeResizeMouseDown.emit({event, id: this.node.id});
  }

  onDragOver(event: DragEvent) {
    if (['div', 'section', 'ul', 'a'].includes(this.node.type)) {
      event.preventDefault();
      event.stopPropagation();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    }
  }

  onDrop(event: DragEvent) {
    if (['div', 'section', 'ul', 'a'].includes(this.node.type)) {
      event.preventDefault();
      const type = event.dataTransfer?.getData('type');
      if (type) {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        const left = event.clientX - rect.left;
        const top = event.clientY - rect.top;
        this.dropNode.emit({ parentId: this.node.id, type, left, top });
      }
    }
  }
}
