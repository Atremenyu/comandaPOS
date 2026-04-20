
import React, { useMemo, useState, useEffect } from 'react';
import { KitchenTicket, Order } from '../types';
import { Icons } from '../constants';

interface DispatchViewProps {
  tickets: KitchenTicket[];
  onUpdateStatus: (id: string, status: KitchenTicket['status'], extra?: Partial<KitchenTicket>) => void;
  restaurantName?: string;
}

const Timer: React.FC<{ startedAt: string; estimatedMinutes: number }> = ({ startedAt, estimatedMinutes }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const totalSeconds = estimatedMinutes * 60;
  const percentage = (elapsed / totalSeconds) * 100;

  let colorClass = 'bg-green-500';
  let textClass = 'text-green-600';
  if (percentage >= 100) {
    colorClass = 'bg-red-600 animate-pulse';
    textClass = 'text-red-600';
  } else if (percentage >= 80) {
    colorClass = 'bg-yellow-500';
    textClass = 'text-yellow-600';
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between items-end mb-1">
        <span className={`text-[10px] font-black uppercase tracking-widest ${textClass}`}>
          {percentage >= 100 ? 'RETRASADO' : 'EN PREPARACIÓN'}
        </span>
        <span className={`text-lg font-black tabular-nums ${textClass}`}>
          {formatTime(elapsed)} / {estimatedMinutes} min
        </span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
        <div
          className={`h-full transition-all duration-1000 ${colorClass}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};

const DispatchView: React.FC<DispatchViewProps> = ({ tickets, onUpdateStatus, restaurantName }) => {
  const [showTimePicker, setShowTimePicker] = useState<string | null>(null);

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const priority = { 'preparing': 0, 'pending': 1, 'ready': 2 };
      if (priority[a.status] !== priority[b.status]) {
        return priority[a.status] - priority[b.status];
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, [tickets]);

  const handleStartPreparing = (ticketId: string, minutes: number) => {
    onUpdateStatus(ticketId, 'preparing', {
      started_at: new Date().toISOString(),
      estimated_time: minutes
    });
    setShowTimePicker(null);
  };

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
        <div className="mb-4 opacity-5"><Icons.ChefHat /></div>
        <p className="text-sm font-black uppercase tracking-widest">Sin Comandas en Cocina</p>
        <p className="text-[10px] uppercase mt-2 tracking-tighter">Esperando nuevas tandas de productos...</p>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-6 bg-slate-50 min-h-full">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {sortedTickets.map(ticket => {
          const isPending = ticket.status === 'pending';
          const isPreparing = ticket.status === 'preparing';
          const isReady = ticket.status === 'ready';
          
          return (
            <div 
              key={ticket.id}
              className={`bg-white rounded-3xl border-l-8 shadow-xl overflow-hidden flex flex-col transition-all ${
                isPreparing
                  ? 'border-yellow-500 scale-[1.02] ring-2 ring-yellow-100 z-10'
                  : isPending
                    ? 'border-red-600 ring-1 ring-red-100'
                    : 'border-green-600 opacity-90'
              }`}
            >
              <div className={`p-4 flex justify-between items-start ${
                isPreparing ? 'bg-yellow-50/50' : isPending ? 'bg-red-50/50' : 'bg-green-50/30'
              }`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm ${
                      isPreparing
                        ? 'bg-yellow-500 text-black'
                        : isPending
                          ? 'bg-red-600 text-white'
                          : 'bg-green-600 text-white'
                    }`}>
                      {isPreparing ? 'EN COCINA' : isPending ? 'PENDIENTE' : 'LISTO'}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      #{ticket.id.slice(0,4).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-black mt-2 tracking-tighter uppercase">
                    TANDA DE COCINA
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                    Recibido: {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>

              <div className="p-5 flex-grow space-y-3">
                {ticket.items.map((item, idx) => (
                  <div key={idx} className="pb-3 border-b border-slate-100 last:border-0">
                    <div className="flex items-start space-x-3">
                      <span className="w-8 h-8 flex-shrink-0 flex items-center justify-center font-black rounded text-sm bg-black text-white">
                        {item.quantity}
                      </span>
                      <div className="flex-grow">
                        <span className="font-black uppercase text-xs tracking-tight block text-black">
                          {item.name}
                        </span>
                        {item.note && (
                          <div className="mt-1.5 p-1.5 rounded-lg border-l-4 text-red-700 bg-red-50 border-red-600">
                            <p className="text-[10px] italic font-medium">{item.note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isPreparing && ticket.started_at && ticket.estimated_time && (
                  <Timer startedAt={ticket.started_at} estimatedMinutes={ticket.estimated_time} />
                )}
              </div>

              <div className="p-5 pt-0">
                {isPending && (
                  <div className="relative">
                    {showTimePicker === ticket.id ? (
                      <div className="bg-slate-900 p-3 rounded-2xl grid grid-cols-3 gap-2 animate-in fade-in zoom-in duration-200">
                        {[5, 10, 15, 20, 30, 45].map(mins => (
                          <button
                            key={mins}
                            onClick={() => handleStartPreparing(ticket.id, mins)}
                            className="bg-red-600 hover:bg-red-700 text-white py-2 rounded-xl font-black text-xs transition-colors"
                          >
                            {mins}'
                          </button>
                        ))}
                        <button
                          onClick={() => setShowTimePicker(null)}
                          className="col-span-3 mt-1 text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest text-center"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowTimePicker(ticket.id)}
                        className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 shadow-xl hover:bg-slate-900 border-b-4 border-red-600"
                      >
                        <Icons.ChefHat />
                        <span>Comenzar Preparación</span>
                      </button>
                    )}
                  </div>
                )}

                {isPreparing && (
                  <button
                    onClick={() => onUpdateStatus(ticket.id, 'ready', { ready_at: new Date().toISOString() })}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 shadow-xl hover:bg-green-700 border-b-4 border-green-900"
                  >
                    <Icons.CheckCircle />
                    <span>¡ORDEN LISTA!</span>
                  </button>
                )}

                {isReady && (
                  <div className="flex items-center justify-center py-2 text-green-600 space-x-2">
                    <Icons.CheckCircle />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Lista para Servir</span>
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
