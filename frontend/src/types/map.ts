export type ElementType = 'fila' | 'mesa';

export interface Seat {
  identificador: string;
}

export interface BaseElement {
  tipo: ElementType;
  etiqueta: string;
  precio: number;
}

export interface RowElement extends BaseElement {
  tipo: 'fila';
  asientos: Seat[];
}

export interface TableElement extends BaseElement {
  tipo: 'mesa';
  sillas: Seat[];
}

export type MapElement = RowElement | TableElement;

export interface Area {
  id: string;
  nombre_area: string;
  color?: string;
  elementos: MapElement[];
}

export interface SeatMap {
  id?: string;
  nombre_plano: string;
  areas: Area[];
}