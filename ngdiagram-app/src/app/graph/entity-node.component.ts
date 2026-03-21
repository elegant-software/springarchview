import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { NgDiagramPortComponent, type NgDiagramNodeTemplate, type Node } from 'ng-diagram';
import { RELATIONSHIP_PORT_LABELS, type RelationshipPortMarker } from './relationship-port-settings';
import { type DiagramNode } from './services/diagram-api.service';

type EntityPort = {
  id: string;
  side: 'left' | 'right';
  type: 'source' | 'target';
  label: RelationshipPortMarker;
  offsetPercent: number;
  title: string;
};

export type EntityNodeTemplateData = {
  label: string;
  entity: DiagramNode;
  leftPorts: EntityPort[];
  rightPorts: EntityPort[];
};

@Component({
  selector: 'app-entity-node',
  standalone: true,
  imports: [CommonModule, NgDiagramPortComponent],
  template: `
    <div class="entity-node">
      <div class="entity-node__header">
        <div class="entity-node__name">{{ data().label }}</div>
        <div class="entity-node__meta">{{ data().entity.metadata?.tableName || data().entity.type }}</div>
      </div>

      @for (port of data().leftPorts; track port.id) {
        <ng-diagram-port
          [id]="port.id"
          [style.top.%]="port.offsetPercent"
          side="left"
          type="target"
        >
          <span class="entity-port-shell entity-port-shell--left" [title]="port.title">
            <span class="entity-port-marker">{{ portLabel(port.label) }}</span>
          </span>
        </ng-diagram-port>
      }

      @for (port of data().rightPorts; track port.id) {
        <ng-diagram-port
          [id]="port.id"
          [style.top.%]="port.offsetPercent"
          side="right"
          type="source"
        >
          <span class="entity-port-shell entity-port-shell--right" [title]="port.title">
            <span class="entity-port-marker">{{ portLabel(port.label) }}</span>
          </span>
        </ng-diagram-port>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .entity-node {
        position: relative;
        box-sizing: border-box;
        width: 220px;
        height: 88px;
        padding: 1rem 1.1rem;
        border: 1px solid rgba(148, 163, 184, 0.38);
        border-radius: 1rem;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98)),
          #fff;
        box-shadow:
          0 18px 44px rgba(15, 23, 42, 0.08),
          0 2px 8px rgba(15, 23, 42, 0.04);
      }

      .entity-node__header {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        text-align: left;
      }

      .entity-node__name {
        color: #0f172a;
        font-size: 1rem;
        font-weight: 700;
        letter-spacing: -0.01em;
      }

      .entity-node__meta {
        color: #64748b;
        font-size: 0.76rem;
        text-transform: lowercase;
      }

      .entity-port-shell {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        overflow: visible;
        pointer-events: none;
      }

      :host ::ng-deep ng-diagram-port,
      :host ::ng-deep .ng-diagram-port.custom-content,
      :host ::ng-deep .ng-diagram-port.custom-content .content-projection {
        background: transparent !important;
        border: 0 !important;
        box-shadow: none !important;
        outline: 0 !important;
      }

      .entity-port-shell--left {
        transform: translate(-100%, -50%);
        margin-right: 0.4rem;
      }

      .entity-port-shell--right {
        transform: translate(0, -50%);
        margin-left: 0.4rem;
      }

      .entity-port-shell::before {
        content: '';
        position: absolute;
        top: 50%;
        width: 1rem;
        height: 2px;
        background: rgba(79, 70, 229, 0.35);
        transform: translateY(-50%);
      }

      .entity-port-shell--left::before {
        right: -0.95rem;
      }

      .entity-port-shell--right::before {
        left: -0.95rem;
      }

      .entity-port-marker {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 18px;
        height: 18px;
        color: #4338ca;
        font-size: 18px;
        font-weight: 700;
        line-height: 1;
        text-align: center;
        filter: drop-shadow(0 1px 2px rgba(79, 70, 229, 0.12));
      }
    `,
  ],
})
export class EntityNodeComponent implements NgDiagramNodeTemplate<EntityNodeTemplateData> {
  node = input.required<Node<EntityNodeTemplateData>>();

  protected readonly data = computed(() => this.node().data);

  protected portLabel(label: RelationshipPortMarker): string {
    return RELATIONSHIP_PORT_LABELS[label];
  }
}
