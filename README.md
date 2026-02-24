# Agent Workflow – Communication Graphs

Initial architecture and API spec for visualizing AI agent or Spring Modulith module communication flows with **ngdiagram**. The goal is to provide a simple, mock-data backed graph API that the UI can render as nodes (agents/modules) and links (messages/relations).

## Architecture (high level)
- **Spring Modulith backend**  
  - `GraphController` exposes read-only REST endpoints (`/api/graph`) that return graph JSON.  
  - `GraphService` aggregates mock data now; later it can read Modulith structural metadata (applications/modules), observability traces, or event log streams.
- **Graph domain model**  
  - `Node` (id, name, type=`agent|module|broker`, status, metadata).  
  - `Link` (id, source, target, label, channel, latencyMs, meta).  
  - `LayoutHint` (optional x/y for deterministic layouts when desired).
- **ngdiagram front-end**  
  - Consumes `/api/graph` payload, mapping `Node` to diagram shapes and `Link` to connectors.  
  - Uses `type` to style shapes (e.g., agents = rounded rectangles, modules = hexagons, brokers = circles).  
  - Uses `status` to set color (healthy/warn/offline).

## API Spec (mocked)
Base URL: `/api/graph`

### GET `/api/graph`
Returns the current communication graph (agents + modules). Suitable for ngdiagram consumption.

Query params (optional):
- `view` – `agents` | `modules` | `all` (default `all`)
- `includeLayout` – `true|false` (default `false`)

Response: `200 OK`
```json
{
  "nodes": [
    {"id": "orchestrator", "name": "Orchestrator", "type": "agent", "status": "healthy"},
    {"id": "planner", "name": "Planner", "type": "agent", "status": "healthy"},
    {"id": "executor", "name": "Executor", "type": "agent", "status": "warn"},
    {"id": "knowledge-base", "name": "Knowledge Base", "type": "module", "status": "healthy"},
    {"id": "event-bus", "name": "Event Bus", "type": "broker", "status": "healthy"}
  ],
  "links": [
    {"id": "l1", "source": "orchestrator", "target": "planner", "label": "delegates", "channel": "HTTP"},
    {"id": "l2", "source": "planner", "target": "executor", "label": "tasks", "channel": "events"},
    {"id": "l3", "source": "executor", "target": "knowledge-base", "label": "queries", "channel": "gRPC"},
    {"id": "l4", "source": "planner", "target": "knowledge-base", "label": "context", "channel": "JDBC"},
    {"id": "l5", "source": "orchestrator", "target": "event-bus", "label": "publish", "channel": "Kafka"},
    {"id": "l6", "source": "event-bus", "target": "executor", "label": "consume", "channel": "Kafka"}
  ],
  "layoutHints": [
    {"id": "orchestrator", "x": 100, "y": 80},
    {"id": "planner", "x": 320, "y": 80},
    {"id": "executor", "x": 540, "y": 80},
    {"id": "knowledge-base", "x": 540, "y": 240},
    {"id": "event-bus", "x": 320, "y": 240}
  ]
}
```

Error responses:
- `400` – unsupported `view`
- `500` – server errors

### Future endpoints (optional)
- `GET /api/graph/modules/{moduleId}` – drill-down on a single Modulith module’s intra-module interactions.
- `GET /api/graph/events?fromTs=&toTs=` – time-windowed communication slices for playback in ngdiagram.

## ngdiagram rendering notes
- Use `nodes` as diagram shapes; map `type` to shape/icon and `status` to color.  
- Use `links` as connectors; map `channel` to line style (solid HTTP, dashed async, dotted broker).  
- If `layoutHints` is present and `includeLayout=true`, seed diagram coordinates for reproducible layouts; otherwise allow ngdiagram’s auto layout.

## Reference implementation (ng-diagram v1.0.0, Angular 18+)
The snippet below shows how to render the `/api/graph` payload with the latest **ng-diagram** release. It uses Angular standalone components and the library’s `initializeModel` helper:

```bash
npm install ng-diagram@latest @angular/core@18 @angular/common@18 @angular/platform-browser@18 rxjs zone.js
```

```typescript
// graph.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { NgDiagramComponent, initializeModel, provideNgDiagram, type DiagramModel } from 'ng-diagram';

type GraphResponse = {
  nodes: { id: string; name: string; type: string; status: string }[];
  links: { id: string; source: string; target: string; label?: string; channel?: string }[];
  layoutHints?: { id: string; x: number; y: number }[];
};

// Deterministic spread used only when backend layout hints are absent.
const DEFAULT_POSITION_SPREAD = 160;
const fallbackPosition = (idx: number) => ({
  x: DEFAULT_POSITION_SPREAD * ((idx % 3) + 1),
  y: DEFAULT_POSITION_SPREAD * (Math.floor(idx / 3) + 1),
});

@Component({
  selector: 'app-graph',
  standalone: true,
  imports: [NgDiagramComponent],
  providers: [provideNgDiagram(), provideHttpClient()],
  template: `
    <div class="graph-shell">
      <ng-diagram [model]="model" />
    </div>
  `,
  styles: [
    `
      .graph-shell {
        display: flex;
        height: 100vh;
        background: #0d1117;
      }
    `,
  ],
})
export class GraphComponent implements OnInit {
  private readonly http = inject(HttpClient);
  model: DiagramModel = initializeModel({ nodes: [], edges: [] });

  ngOnInit(): void {
    this.http.get<GraphResponse>('/api/graph?includeLayout=true').subscribe((graph) => {
      const pos = new Map(graph.layoutHints?.map((hint) => [hint.id, { x: hint.x, y: hint.y }]) ?? []);
      this.model = initializeModel({
        nodes: graph.nodes.map((n, idx) => ({
          id: n.id,
          position: pos.get(n.id) ?? fallbackPosition(idx),
          data: { label: n.name, type: n.type, status: n.status },
        })),
        edges: graph.links.map((l, idx) => ({
          id: l.id ?? `edge-${idx}`,
          source: l.source,
          target: l.target,
          data: { label: l.label ?? '', channel: l.channel ?? '' },
        })),
      });
    });
  }
}
```

Style import (required):

```scss
/* src/styles.scss */
@import 'ng-diagram/styles.css';
```

Mock API response for local dev lives in [`graph-mock.json`](./graph-mock.json); serve it via `json-server`, a simple Express stub, or Angular’s `http-server` to test the diagram quickly.

## Next steps
- Replace mock data with Modulith metadata (Spring Modulith `ApplicationModules`) and tracing data.  
- Add WebSocket/SSE push from the backend to stream updates to ngdiagram for near-real-time graphs.
