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
  cantidad_sillas: number;
}

export type MapElement = RowElement | TableElement;

export interface Area {
  nombre_area: string;
  elementos: MapElement[];
}

export interface SeatMap {
  id?: string;
  nombre_plano: string;
  areas: Area[];
}

export interface Area {
  id?: string;
  nombre_area: string;
  elementos: MapElement[];
}