export type RelationshipPortMarker = '*' | '0' | '1';

export const RELATIONSHIP_PORT_LABELS: Record<RelationshipPortMarker, string> = {
  '*': '*',
  '0': '0',
  '1': '1',
};

export const RELATIONSHIP_PORT_RENDER_SETTINGS = {
  markerOffset: 18,
  markerSize: 18,
} as const;
