
import React, { useState, useMemo } from 'react';
import { Product, CartItem, Category, PaymentMethod } from '../types';
import { Icons } from '../constants';

interface POSViewProps {
  products: Product[];
  categories: Category[];
  cart: CartItem[];
  onAddToCart: (p: Product) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onUpdateNote: (id: string, note: string) => void;
  onCheckout: (client: string, table: string, payment: PaymentMethod) => void;
}

const POSView: React.FC<POSViewProps> = ({ products, categories, cart, onAddToCart, onUpdateQuantity, onUpdateNote, onCheckout }) => {
  const [activeCategory, setActiveCategory] = useState<Category | 'Todos'>('Todos');
  const [client, setClient] = useState('');
  const [table, setTable] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('Efectivo');
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const displayCategories: (Category | 'Todos')[] = ['Todos', ...categories];

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'Todos') return products;
    return products.filter(p => p.category === activeCategory);
  }, [products, activeCategory]);

  const total = useMemo(() => 
    cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), 
  [cart]);

  const handleCheckoutSubmit = () => {
    onCheckout(client, table, payment);
    setClient('');
    setTable('');
    setPayment('Efectivo');
    setShowCheckout(false);
  };

  const isCartVisible = cart.length > 0;

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* Product Catalog */}
      <div className={`flex-grow p-2 sm:p-4 overflow-y-auto transition-all ${isCartOpen ? 'opacity-50 blur-[2px] lg:opacity-100 lg:blur-0' : ''}`}>
        <div className="mb-4 sm:mb-6 flex space-x-2 overflow-x-auto pb-2 scrollbar-hide flex-nowrap">
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

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 pb-24 lg:pb-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              disabled={showCheckout}
              onClick={() => onAddToCart(product)}
              className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-red-600 transition-all text-left flex flex-col justify-between active:scale-95 group"
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
          {cart.length > 0 && !showCheckout && (
             <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded">
               {cart.length} ITEMS
             </span>
          )}
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
            <div className="mb-4 opacity-10">
               <Icons.Cart />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest">Carrito Vacío</p>
          </div>
        ) : (
          <div className="flex-grow flex flex-col overflow-hidden bg-slate-50/50">
            {showCheckout ? (
              /* Integrated Checkout Form */
              <div className="flex-grow overflow-y-auto p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Destinatario</h4>
                      <span className="text-[8px] font-bold text-slate-300 uppercase italic">Vacío = Mostrador</span>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400">
                          <Icons.User />
                        </span>
                        <input 
                          type="text" placeholder="Nombre (Opcional)" 
                          className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-red-600 outline-none transition bg-slate-50 focus:bg-white"
                          value={client} onChange={e => setClient(e.target.value)}
                        />
                      </div>
                      
                      <div className="relative">
                        <span className="absolute left-3 top-3.5 text-slate-400">
                          <Icons.MapPin />
                        </span>
                        <input 
                          type="text" placeholder="Mesa / Ubicación (Opcional)" 
                          className="w-full text-sm pl-10 pr-4 py-3 rounded-xl border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-red-600 outline-none transition bg-slate-50 focus:bg-white"
                          value={table} onChange={e => setTable(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Forma de Pago</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {(['Efectivo', 'Tarjeta', 'Transferencia'] as PaymentMethod[]).map(method => (
                        <button
                          key={method}
                          onClick={() => setPayment(method)}
                          className={`flex items-center space-x-3 p-3 rounded-xl border-2 transition-all ${
                            payment === method 
                            ? 'border-red-600 bg-red-50 text-red-700' 
                            : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${payment === method ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                            <Icons.CreditCard />
                          </div>
                          <span className="font-black text-xs uppercase tracking-tight">{method}</span>
                          {payment === method && (
                            <div className="flex-grow flex justify-end text-red-600">
                              <Icons.CheckCircle />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-black text-white p-6 rounded-3xl shadow-2xl space-y-5 border-t-4 border-red-600">
                   <div className="flex justify-between items-center opacity-60 text-[10px] font-black uppercase tracking-widest">
                      <span>Subtotal</span>
                      <span>{cart.length} items</span>
                   </div>
                   <div className="text-4xl font-black tracking-tighter border-b border-slate-800 pb-4">${total.toLocaleString()}</div>
                   <button 
                    onClick={handleCheckoutSubmit}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-base uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-900/40 active:scale-[0.98]"
                  >
                    FINALIZAR COBRO
                  </button>
                </div>
              </div>
            ) : (
              /* Regular Cart List */
              <>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex flex-col space-y-2 group border-b border-slate-200 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-grow">
                          <h4 className="font-bold text-sm text-slate-900 uppercase tracking-tight leading-none">{item.name}</h4>
                          <p className="text-[10px] text-slate-500 font-bold mt-1">${item.price}</p>
                        </div>
                        <div className="flex items-center space-x-2 bg-white rounded border border-slate-300 p-0.5">
                          <button 
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded transition"
                          >
                            <Icons.Minus />
                          </button>
                          <span className="font-black text-xs w-6 text-center">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQuantity(item.id, 1)}
                            className="text-red-600 hover:bg-red-50 p-1 rounded transition"
                          >
                            <Icons.Plus />
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="+ Nota especial"
                        className="text-[10px] font-medium w-full p-2 border border-slate-200 rounded bg-white focus:ring-1 focus:ring-red-600 outline-none transition"
                        value={item.note || ''}
                        onChange={(e) => onUpdateNote(item.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="p-4 bg-white border-t border-slate-300">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total:</span>
                      <span className="text-3xl font-black text-black tracking-tighter">${total.toLocaleString()}</span>
                    </div>
                    <button 
                      onClick={() => setShowCheckout(true)}
                      className="w-full bg-black text-white py-4 rounded-xl font-black text-base uppercase tracking-widest hover:bg-slate-900 transition shadow-xl active:scale-[0.98] flex items-center justify-center space-x-2 border-b-4 border-red-600"
                    >
                      <Icons.CheckCircle />
                      <span>COBRAR</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {isCartVisible && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none lg:hidden">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-black text-white py-4 rounded-2xl font-black text-base uppercase tracking-widest hover:bg-slate-900 transition shadow-2xl active:scale-[0.98] flex items-center justify-between px-6 border-b-4 border-red-600 pointer-events-auto"
          >
            <div className='flex items-center space-x-2'>
              <Icons.Cart />
              <span>TU PEDIDO</span>
              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-full">
                {cart.length}
              </span>
            </div>
            <span className="text-xl font-black tracking-tighter">${total.toLocaleString()}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default POSView;
