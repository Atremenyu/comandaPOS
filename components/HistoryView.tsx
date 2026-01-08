
import React, { useMemo, useState } from 'react';
import { Order } from '../types';
import { Icons } from '../constants';
import { generateTicketPDF } from '../services/pdfGenerator';

interface HistoryViewProps {
  orders: Order[];
  restaurantName?: string;
}

const HistoryView: React.FC<HistoryViewProps> = ({ orders, restaurantName }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = orders.reduce((acc, o) => acc + o.total, 0);
    const delivered = orders.filter(o => o.status === 'delivered').length;
    return { total, count: orders.length, delivered };
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <Icons.History />
        <p className="mt-2 text-xs font-black uppercase tracking-widest">Sin Ventas Registradas</p>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-black text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border-t-4 border-red-600 relative overflow-hidden">
          <div className="absolute right-[-10px] bottom-[-10px] opacity-10 scale-150 rotate-12"><Icons.Cart /></div>
          <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Total Bruto</p>
          <p className="text-2xl sm:text-3xl font-black mt-1">${stats.total.toLocaleString()}</p>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Servicios</p>
          <p className="text-2xl sm:text-3xl font-black text-black mt-1">{stats.count}</p>
        </div>
        <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
          <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em]">Entregas OK</p>
          <div className="flex items-baseline space-x-2 mt-1">
            <p className="text-2xl sm:text-3xl font-black text-red-600">{stats.delivered}</p>
            <p className="text-xs font-black text-slate-300">({Math.round((stats.delivered/stats.count)*100)}%)</p>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 font-black text-xs uppercase tracking-widest text-slate-500">
          Registro de Movimientos
        </div>
        <div className="divide-y divide-slate-100">
          {orders.map(order => {
            const isMostrador = order.client === 'Mostrador' && order.table === 'Mostrador';
            
            return (
              <div key={order.id} className="transition-colors hover:bg-red-50/20">
                <div 
                  className="p-3 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between cursor-pointer"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`p-2 rounded-lg border-2 ${order.status === 'delivered' ? 'bg-black text-white border-black' : 'bg-white text-red-600 border-red-600'}`}>
                      {order.status === 'delivered' ? <Icons.CheckCircle /> : <Icons.ChefHat />}
                    </div>
                    <div>
                      <p className="font-black text-black uppercase tracking-tighter text-xs sm:text-sm">
                        {isMostrador ? 'VENTA A MOSTRADOR' : `${order.client} • Mesa ${order.table}`}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {new Date(order.date).toLocaleString()} • {order.payment}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center justify-between mt-3 sm:mt-0 sm:space-x-6">
                    <div className='flex-grow sm:flex-grow-0'>
                      <p className="font-black text-black text-base sm:text-xl tracking-tighter">${order.total.toLocaleString()}</p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${order.status === 'delivered' ? 'bg-black text-white' : 'bg-red-600 text-white'}`}>
                        {order.status === 'delivered' ? 'OK' : 'PEND'}
                      </span>
                    </div>
                    <div className={`transition-transform duration-300 text-red-600 sm:ml-6 ${expandedId === order.id ? 'rotate-180' : ''}`}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>

                {expandedId === order.id && (
                  <div className="px-4 sm:px-16 pb-4 sm:pb-6 animate-in fade-in slide-in-from-top-2 duration-400">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-5 space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex flex-col border-b border-slate-200 last:border-0 pb-2">
                          <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                            <span className="text-slate-600">{item.quantity}x {item.name}</span>
                            <span className="text-black">${(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                          {item.note && (
                            <span className="text-[9px] italic font-bold text-red-600 mt-1">
                              &gt; NOTA: {item.note}
                            </span>
                          )}
                        </div>
                      ))}
                      <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end space-x-3">
                         <button 
                          onClick={(e) => { e.stopPropagation(); window.print(); }}
                          className="text-[9px] font-black uppercase tracking-widest flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-black hover:text-white transition"
                        >
                          <Icons.Printer /> <span>Imprimir</span>
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); generateTicketPDF(order, restaurantName); }}
                          className="text-[9px] font-black uppercase tracking-widest flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg shadow-red-100 transition"
                        >
                          <Icons.FileText /> <span>Bajar Ticket</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HistoryView;
