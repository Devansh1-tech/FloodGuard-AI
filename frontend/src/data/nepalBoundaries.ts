/**
 * nepalBoundaries.ts — Typed boundary geometries extracted from UN-OCHA / Survey Department of Nepal.
 */

import boundariesData from './nepalBoundaries.json';

export interface BoundariesData {
  nepal_border: [number, number][];
  terai_full: [number, number][];
  terai_eastern: [number, number][];
  terai_central: [number, number][];
  terai_western: [number, number][];
  terai_far_western: [number, number][];
}

export const nepalBoundaries: BoundariesData = boundariesData as BoundariesData;
