
import React, { useMemo, useState } from 'react';
import { Order, OrderStatus } from '../types';
import { Icons } from '../constants';
import { generateTicketPDF } from '../services/pdfGenerator';
import { addMinutes } from 'date-fns';

interface DispatchViewProps {
  orders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus, estimatedReadyAt?: string) => void;
  restaurantName?: string;
}

const DispatchView: React.FC<DispatchViewProps> = ({ orders, onUpdateStatus, restaurantName }) => {
  const [prepTimes, setPrepTimes] = useState<Record<string, string>>({});

  const activeOrders = useMemo(() => {
    return orders.filter(o => o.status !== 'delivered').sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
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
    <div className="p-2 sm:p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-6">
        {activeOrders.map(order => {
          const isPending = order.status === 'pending';
          const isAccepted = order.status === 'accepted';
          const isReady = order.status === 'ready';
          const isMostradorTable = order.table === 'Mostrador';
          const isMostradorClient = order.client === 'Mostrador';
          
          const handleAccept = () => {
              const minutes = parseInt(prepTimes[order.id] || '20');
              const estimatedReadyAt = addMinutes(new Date(), minutes).toISOString();
              onUpdateStatus(order.id, 'accepted', estimatedReadyAt);
          };

          return (
            <div 
              key={order.id} 
              className={`bg-white rounded-3xl border-l-8 shadow-xl overflow-hidden flex flex-col transition-all ${
                isReady ? 'border-green-600' : isAccepted ? 'border-blue-600' : 'border-red-600'
              } scale-100 ring-1 ring-slate-100`}
            >
              <div className={`p-4 flex justify-between items-start ${
                  isReady ? 'bg-green-50/50' : isAccepted ? 'bg-blue-50/50' : 'bg-red-50/50'
              }`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${
                      isReady ? 'bg-green-600 text-white' : isAccepted ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {isReady ? 'PEDIDO LISTO' : isAccepted ? 'EN COCINA' : 'NUEVO PEDIDO'}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-black mt-2 tracking-tighter uppercase">
                    {isMostradorTable ? 'VENTA MOSTRADOR' : `Mesa: ${order.table}`}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    {isMostradorClient ? 'CONSUMIDOR FINAL' : order.client} • {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                        !isReady ? 'bg-black text-white' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {item.quantity}
                      </span>
                      <div className="flex-grow">
                        <span className={`font-black uppercase text-xs tracking-tight block ${!isReady ? 'text-black' : 'text-slate-400 line-through'}`}>
                          {item.name}
                        </span>
                        {item.note && (
                          <div className={`mt-1.5 p-1.5 rounded-lg border-l-4 ${
                            !isReady ? 'text-red-700 bg-red-50 border-red-600' : 'text-slate-400 bg-slate-50 border-slate-300'
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

              <div className="p-5 pt-0 space-y-3">
                {isPending && (
                  <div className="flex space-x-2">
                    <div className="relative flex-grow">
                      <input
                        type="number"
                        placeholder="Minutos"
                        className="w-full pl-3 pr-10 py-4 rounded-2xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-red-600 outline-none text-sm font-black"
                        value={prepTimes[order.id] || ''}
                        onChange={(e) => setPrepTimes({...prepTimes, [order.id]: e.target.value})}
                      />
                      <span className="absolute right-4 top-4.5 text-[10px] font-black text-slate-400 uppercase">Min</span>
                    </div>
                    <button
                      onClick={handleAccept}
                      className="bg-black text-white px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 border-b-4 border-slate-800"
                    >
                      Aceptar
                    </button>
                  </div>
                )}

                {isAccepted && (
                   <button 
                    onClick={() => onUpdateStatus(order.id, 'ready')}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 border-b-4 border-blue-900"
                  >
                    <Icons.CheckCircle />
                    <span>Marcar Como Listo</span>
                  </button>
                )}

                {isReady && (
                   <div className="text-center py-4 bg-green-50 rounded-2xl border border-green-100">
                     <p className="text-[10px] font-black text-green-700 uppercase tracking-widest">Esperando al cajero...</p>
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DispatchView;
