import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PageNode } from './types';

@Component({
  selector: 'app-layer-node',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="flex flex-col">
      <div 
        class="flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer text-sm transition-colors"
        [class.bg-blue-600]="isSelected"
        [class.text-white]="isSelected"
        [class.text-zinc-400]="!isSelected"
        [class.hover:bg-zinc-800]="!isSelected"
        tabindex="0"
        (click)="onClick($event)"
        (keydown.enter)="nodeSelect.emit({id: node.id, shift: false}); $event.stopPropagation()"
      >
        <mat-icon class="text-[16px] w-4 h-4">{{ getIcon(node.type) }}</mat-icon>
        <span class="truncate">{{ node.name }}</span>
      </div>
      @if (node.children.length > 0) {
        <div class="pl-3 border-l border-zinc-700 ml-2 mt-1 flex flex-col gap-0.5">
          @for (child of node.children; track child.id) {
            <app-layer-node 
              [node]="child" 
              [selectedIds]="selectedIds"
              (nodeSelect)="nodeSelect.emit($event)"
            ></app-layer-node>
          }
        </div>
      }
    </div>
  `
})
export class LayerNodeComponent {
  @Input() node!: PageNode;
  @Input() selectedIds: string[] = [];
  @Output() nodeSelect = new EventEmitter<{id: string, shift: boolean}>();

  get isSelected() {
    return this.selectedIds.includes(this.node.id);
  }

  onClick(event: MouseEvent) {
    event.stopPropagation();
    this.nodeSelect.emit({id: this.node.id, shift: event.shiftKey});
  }

  getIcon(type: string) {
    switch(type) {
      case 'div': return 'check_box_outline_blank';
      case 'text': return 'title';
      case 'button': return 'smart_button';
      case 'image': return 'image';
      default: return 'insert_drive_file';
    }
  }
}
