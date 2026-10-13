import type { Shape } from '../domain/Shape.js';
import type { SvgElement } from './SvgElement.js';

export interface ShapeImporter { fromSvg(element: SvgElement): Shape; }
