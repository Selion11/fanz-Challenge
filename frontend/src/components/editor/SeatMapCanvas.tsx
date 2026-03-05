import { SeatMap, Area } from '@/types/map';
import { RowVisual } from './RowElement';
import { TableVisual } from './TableElement';

interface SeatMapCanvasProps {
  map: SeatMap;
}

export const SeatMapCanvas = ({ map }: SeatMapCanvasProps) => {
  return (
    <div className="w-full max-w-5xl bg-white rounded-3xl shadow-sm border border-gray-100 p-12 min-h-[80vh]">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {map.nombre_plano}
        </h2>
        <div className="h-1 w-20 bg-black mx-auto mt-2 rounded-full" />
      </div>

      <div className="space-y-24">
        <div className="mt-8 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center bg-gray-50/30">
          <span className="text-sm font-black text-gray-300 uppercase tracking-[0.7em]">
            ESCENARIO / STAGE
          </span>
        </div>

        {map.areas.map((area: Area) => (
          <section key={area.id} className="relative pt-8 border-t border-gray-50">
            <div className="flex flex-wrap justify-center items-center gap-16 mt-8">
              {area.elementos.map((elemento, index) => (
                <div key={index} className="flex-shrink-0">
                  {elemento.tipo === 'fila' ? (
                    <RowVisual 
                      element={elemento} 
                      color={area.color || '#000000'}
                      areaName={area.nombre_area}
                    />
                  ) : (
                    <TableVisual 
                      element={elemento} 
                      color={area.color || '#000000'}
                      areaName={area.nombre_area} 
                    />
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};