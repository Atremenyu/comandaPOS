
import React, { useMemo } from 'react';
import { Order } from '../types';
import { Icons } from '../constants';
import { generateTicketPDF } from '../services/pdfGenerator';

interface DispatchViewProps {
  orders: Order[];
  onDeliver: (id: string) => void;
  restaurantName?: string;
}

const DispatchView: React.FC<DispatchViewProps> = ({ orders, onDeliver, restaurantName }) => {
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      if (a.status === 'pending' && b.status === 'delivered') return -1;
      if (a.status === 'delivered' && b.status === 'pending') return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <div className="mb-4 opacity-5">
          <Icons.ChefHat />
        </div>
        <p className="text-sm font-black uppercase tracking-widest">Sin Órdenes Pendientes</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sortedOrders.map(order => {
          const isPending = order.status === 'pending';
          const isMostradorTable = order.table === 'Mostrador';
          const isMostradorClient = order.client === 'Mostrador';
          
          return (
            <div 
              key={order.id} 
              className={`bg-white rounded-3xl border-l-8 shadow-xl overflow-hidden flex flex-col transition-all ${
                isPending 
                  ? 'border-red-600 scale-100 ring-1 ring-red-100' 
                  : 'border-green-600 opacity-75'
              }`}
            >
              <div className={`p-4 flex justify-between items-start ${isPending ? 'bg-red-50/50' : 'bg-green-50/30'}`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${
                      isPending ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {isPending ? 'EN PREPARACIÓN' : 'ENTREGADO'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-black mt-2 tracking-tighter uppercase">
                    {isMostradorTable ? 'VENTA MOSTRADOR' : `Mesa: ${order.table}`}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {isMostradorClient ? 'CONSUMIDOR FINAL' : order.client} • {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex space-x-1">
                   <button 
                    onClick={() => generateTicketPDF(order, restaurantName)}
                    className="p-2 bg-white text-black border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-600 shadow-sm transition"
                    title="PDF"
                  >
                    <Icons.FileText />
                  </button>
                </div>
              </div>

              <div className="p-5 flex-grow space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="pb-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-start space-x-3">
                      <span className={`w-8 h-8 flex-shrink-0 flex items-center justify-center font-black rounded text-sm ${
                        isPending ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {item.quantity}
                      </span>
                      <div className="flex-grow">
                        <span className={`font-black uppercase text-xs tracking-tight block ${isPending ? 'text-black' : 'text-slate-400 line-through'}`}>
                          {item.name}
                        </span>
                        {item.note && (
                          <div className={`mt-1.5 p-1.5 rounded-lg border-l-4 ${
                            isPending ? 'text-red-700 bg-red-50 border-red-600' : 'text-slate-400 bg-slate-50 border-slate-300'
                          }`}>
                            <p className="text-[10px] font-black uppercase tracking-widest">Nota:</p>
                            <p className="text-[10px] italic font-medium">{item.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {isPending && (
                <div className="p-5 pt-0">
                   <button 
                    onClick={() => onDeliver(order.id)}
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 border-b-4 border-red-900"
                  >
                    <Icons.CheckCircle />
                    <span>Marcar Despachado</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DispatchView;
