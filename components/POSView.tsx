
import React, { useState, useMemo } from 'react';
import { Product, CartItem, Category, PaymentMethod, Order, OrderStatus } from '../types';
import { Icons } from '../constants';

interface POSViewProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  onAddToCart: (p: Product) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdateNote: (id: string, note: string) => void;
  onCheckout: (client: string, table: string, payment: PaymentMethod, status: OrderStatus, loyalty: boolean, discount: boolean) => void;
  openOrders: Order[];
  onUpdateStatus: (id: string, status: OrderStatus) => void;
  onLoadOrder: (order: Order) => void;
}

const POSView: React.FC<POSViewProps> = ({
  products, categories, cart, onAddToCart, onUpdateQuantity, onUpdateNote, onCheckout,
  openOrders, onUpdateStatus, onLoadOrder
}) => {
  const [activeCategory, setActiveCategory] = useState<Category | 'Todos'>('Todos');
  const [client, setClient] = useState('');
  const [table, setTable] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('Efectivo');
  const [applyLoyalty, setApplyLoyalty] = useState(false);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showOpenTablesModal, setShowOpenTablesModal] = useState(false);

  const displayCategories: (Category | 'Todos')[] = ['Todos', ...categories];

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Todos') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const rawTotal = useMemo(() =>
    cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), 
  [cart]);

  // Business Logic for Discounts (Pro Edition)
  // Loyalty = Free item or similar (we'll show a label)
  // Discount = 10% off
  const total = useMemo(() => {
    let t = rawTotal;
    if (applyDiscount) t = t * 0.9;
    return t;
  }, [rawTotal, applyDiscount]);

  const isTable = table.trim() !== '' && table.toLowerCase() !== 'mostrador';

  const handleCheckoutSubmit = (finalStatus: OrderStatus = 'delivered') => {
    onCheckout(client, table, payment, finalStatus, applyLoyalty, applyDiscount);
    setClient('');
    setTable('');
    setPayment('Efectivo');
    setApplyLoyalty(false);
    setApplyDiscount(false);
    setShowCheckout(false);
  };

  const isCartVisible = cart.length > 0;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Product Catalog */}
      <div className={`flex-grow p-2 sm:p-4 overflow-y-auto transition-all ${isCartOpen ? 'opacity-50 blur-[2px] lg:opacity-100 lg:blur-0' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide flex-nowrap flex-grow mr-4">
            {displayCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 sm:px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all shadow-sm whitespace-nowrap ${
                  activeCategory === cat
                  ? 'bg-red-600 text-white shadow-red-200'
                  : 'bg-white text-slate-800 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Open Tables Button */}
          {openOrders.length > 0 && (
            <button
              onClick={() => setShowOpenTablesModal(true)}
              className="flex-shrink-0 bg-black text-white px-4 py-2 rounded-full font-black text-[10px] uppercase tracking-widest flex items-center space-x-2 border-b-2 border-red-600 shadow-lg"
              aria-label="Mesas Abiertas"
            >
              <Icons.MapPin />
              <span className="hidden sm:inline">Mesas:</span>
              <span>{openOrders.length}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 pb-24 lg:pb-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              disabled={showCheckout}
              onClick={() => onAddToCart(product)}
              className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-600 transition-all text-left flex flex-col justify-between active:scale-95 group product-card"
            >
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-black text-white mb-2 sm:mb-3 inline-block">
                  {product.category}
                </span>
                <h3 className="font-bold text-slate-900 leading-tight group-hover:text-red-600 transition-colors text-sm sm:text-base">
                  {product.name}
                </h3>
              </div>
              <p className="mt-2 sm:mt-4 text-lg sm:text-xl font-black text-black">
                ${product.price.toLocaleString()}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Open Tables Modal */}
      {showOpenTablesModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowOpenTablesModal(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border-t-8 border-red-600 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-2xl font-black text-black tracking-tighter uppercase">Cuentas Abiertas</h2>
              <button onClick={() => setShowOpenTablesModal(false)} className="text-slate-400 hover:text-red-600 transition">
                <div className="rotate-45 scale-150"><Icons.Plus /></div>
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {openOrders.map(order => (
                <div key={order.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-black text-lg text-black uppercase tracking-tighter">MESA {order.table}</h4>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cliente: {order.client} • Total: ${order.total.toLocaleString()}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        onLoadOrder(order);
                        setTable(order.table);
                        setClient(order.client);
                        setShowOpenTablesModal(false);
                      }}
                      className="bg-black text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition"
                    >
                      Añadir Items
                    </button>
                    <button
                      onClick={() => {
                        onLoadOrder(order);
                        setTable(order.table);
                        setClient(order.client);
                        setShowCheckout(true);
                        setShowOpenTablesModal(false);
                      }}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-700 transition"
                    >
                      Cerrar Cuenta
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Cart Panel */}
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 lg:hidden ${
          isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsCartOpen(false)}
        ></div>
      </div>

      <div className={`
        fixed top-0 right-0 h-full z-40 bg-white w-full max-w-md lg:max-w-none lg:w-96 lg:static lg:z-auto
        border-l border-slate-200 flex flex-col shadow-2xl lg:shadow-none
        transform transition-transform duration-300 ease-in-out
        ${isCartOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0
        ${isCartVisible ? '' : 'hidden lg:flex'}
      `}>
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white flex-shrink-0">
          <div className="flex items-center space-x-2 font-black text-black uppercase tracking-tighter">
            <Icons.Cart />
            <span>{showCheckout ? 'Caja / Checkout' : 'Tu Pedido'}</span>
          </div>
          {(showCheckout || isCartOpen) && (
            <button 
              onClick={() => {
                setShowCheckout(false)
                setIsCartOpen(false)
              }}
              className="text-slate-400 hover:text-red-600 p-1 transition lg:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          )}
        </div>

        {!isCartVisible ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-8">
            <div className="mb-4 opacity-10"><Icons.Cart /></div>
            <p className="text-xs font-bold uppercase tracking-widest">Carrito Vacío</p>
          </div>
        ) : (
          <div className="flex-grow flex flex-col overflow-hidden bg-slate-50/50">
            {showCheckout ? (
              <div className="flex-grow overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Datos del Pedido</h4>
                  <div className="space-y-3">
                    <input
                      type="text" placeholder="Cliente"
                      className="w-full text-sm px-4 py-3 rounded-xl ring-1 ring-slate-200 outline-none transition bg-slate-50 focus:bg-white"
                      value={client} onChange={e => setClient(e.target.value)}
                    />
                    <input
                      type="text" placeholder="Mesa (Vacío = Mostrador)"
                      className="w-full text-sm px-4 py-3 rounded-xl ring-1 ring-slate-200 outline-none transition bg-slate-50 focus:bg-white"
                      value={table} onChange={e => setTable(e.target.value)}
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Beneficios PRO</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <span className="text-xs font-black uppercase tracking-tight">Activar Lealtad</span>
                      <input
                        type="checkbox" checked={applyLoyalty} onChange={e => setApplyLoyalty(e.target.checked)}
                        className="w-5 h-5 accent-red-600"
                      />
                    </label>
                    <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-50 transition">
                      <span className="text-xs font-black uppercase tracking-tight">Descuento Especial (10%)</span>
                      <input
                        type="checkbox" checked={applyDiscount} onChange={e => setApplyDiscount(e.target.checked)}
                        className="w-5 h-5 accent-red-600"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-black text-white p-6 rounded-3xl shadow-2xl space-y-5 border-t-4 border-red-600">
                   <div className="flex justify-between items-center opacity-60 text-[10px] font-black uppercase tracking-widest">
                      <span>Total a Cobrar</span>
                      {applyDiscount && <span className="text-red-500">-10% APLICADO</span>}
                   </div>
                   <div className="text-4xl font-black tracking-tighter border-b border-slate-800 pb-4">${total.toLocaleString()}</div>

                   {isTable ? (
                     <div className="grid grid-cols-1 gap-2">
                       <button
                        onClick={() => handleCheckoutSubmit('open')}
                        className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-base uppercase tracking-widest hover:bg-red-700 transition btn-send-kitchen"
                      >
                        Enviar a Cocina
                      </button>
                      <button
                        onClick={() => handleCheckoutSubmit('delivered')}
                        className="w-full bg-white text-black py-4 rounded-xl font-black text-base uppercase tracking-widest hover:bg-slate-200 transition btn-close-account"
                      >
                        Cerrar Cuenta y Pagar
                      </button>
                     </div>
                   ) : (
                    <button
                      onClick={() => handleCheckoutSubmit('delivered')}
                      className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-base uppercase tracking-widest hover:bg-red-700 transition btn-cobrar"
                    >
                      COBRAR AHORA
                    </button>
                   )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className={`flex flex-col space-y-2 group border-b border-slate-200 pb-3 ${item.isPersisted ? 'opacity-60' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-grow">
                          <div className="flex items-center space-x-2">
                             <h4 className="font-bold text-sm text-slate-900 uppercase tracking-tight leading-none">{item.name}</h4>
                             {item.isPersisted && <span className="text-[8px] font-black bg-slate-100 px-1 rounded">LISTO</span>}
                          </div>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">${item.price}</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-white rounded border border-slate-300 p-0.5">
                          <button 
                            disabled={item.isPersisted}
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className={`text-red-600 p-1 ${item.isPersisted ? 'opacity-20' : ''}`}
                          >
                            <Icons.Minus />
                          </button>
                          <span className="font-black text-xs w-6 text-center">{item.quantity}</span>
                          <button 
                            disabled={item.isPersisted}
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className={`text-red-600 p-1 ${item.isPersisted ? 'opacity-20' : ''}`}
                          >
                            <Icons.Plus />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text" placeholder="+ Nota especial"
                        className="text-[10px] font-medium w-full p-2 border border-slate-200 rounded bg-white focus:ring-1 focus:ring-red-600 outline-none"
                        value={item.note || ''} onChange={(e) => onUpdateNote(item.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-white border-t border-slate-300">
                  <div className="flex justify-between items-center px-1 mb-4">
                    <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Subtotal:</span>
                    <span className="text-3xl font-black text-black tracking-tighter">${rawTotal.toLocaleString()}</span>
                  </div>
                  <button
                    onClick={() => setShowCheckout(true)}
                    className="w-full bg-black text-white py-4 rounded-xl font-black text-base uppercase tracking-widest hover:bg-slate-900 transition border-b-4 border-red-600 btn-continuar"
                  >
                    CONTINUAR
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isCartVisible && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/20 to-transparent lg:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-black text-white py-4 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-between px-6 border-b-4 border-red-600"
          >
            <div className='flex items-center space-x-2'><Icons.Cart /><span>TOTAL: ${total.toLocaleString()}</span></div>
            <Icons.CheckCircle />
          </button>
        </div>
      )}
    </div>
  );
};

export default POSView;
