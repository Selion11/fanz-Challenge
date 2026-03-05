export type ElementType = 'fila' | 'mesa';

export interface ElementPosition {
  x: number;
  y: number;
}

export interface Seat {
  identificador: string; 
}

export interface BaseElement {
  tipo: ElementType;
  etiqueta: string; 
  precio: number;
  posicion: ElementPosition; 
}

export interface RowElement extends BaseElement {
  tipo: 'fila';
  asientos: Seat[];
  curvatura: number;
  rotacion: number;
}

export interface TableElement extends BaseElement {
  tipo: 'mesa';
  sillas: Seat[];
}

export type MapElement = RowElement | TableElement;

export interface Area {
  id?: string;
  nombre_area: string;
  color?: string;
  elementos: MapElement[];
}

// --- NUEVAS INTERFACES PARA EL ESCENARIO ---
export interface StageConfig {
  forma: 'circulo' | 'cuadrado' | 'rectangulo';
  posicion: ElementPosition;
  ancho: number;
  alto: number;
}

export interface SeatMap {
  id?: string;
  nombre_plano: string;
  areas: Area[];
  escenario?: StageConfig; // Lo agregamos como opcional para no romper mapas viejos
}