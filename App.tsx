
import React, { useState, useEffect, useMemo } from 'react';
import { Product, Order, ViewState, CartItem, PaymentMethod, Category, OrderStatus } from './types';
import { storage } from './services/storage';
import { api, socket } from './services/api';
import { INITIAL_CATEGORIES, Icons } from './constants';
import { startOfDay, endOfDay, format } from 'date-fns';
import POSView from './components/POSView';
import DispatchView from './components/DispatchView';
import HistoryView from './components/HistoryView';
import ProductManagement from './components/ProductManagement';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('pos');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]); // For pending orders in dispatch
  const [dailyOrders, setDailyOrders] = useState<Order[]>([]); // For the history view
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  
  const [restaurantName, setRestaurantName] = useState('Mi Restaurante');
  const [eventType, setEventType] = useState('Evento Gastronómico');
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsData = await api.getProducts();
        setProducts(productsData);

        const activeOrders = await api.getActiveOrders();
        setOrders(activeOrders);

        // Fetch today's orders for the history view
        await fetchOrdersByDate(new Date());

        // Load other data from local storage
        const savedCategories = storage.getCategories();
        const savedName = storage.getRestaurantName();
        const savedType = storage.getEventType();

        setCategories(savedCategories.length > 0 ? savedCategories : INITIAL_CATEGORIES);
        setRestaurantName(savedName);
        setEventType(savedType);
        setIsLoaded(true);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setIsLoaded(true); // Still set to loaded to show UI
      }
    };

    fetchData();

    // Socket listeners
    socket.on('new-order', (order: Order) => {
      setOrders(prev => [order, ...prev]);
    });

    socket.on('order-updated', (updatedOrder: Order) => {
      setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
      // If we are in history view, we might want to refresh too
    });

    return () => {
      socket.off('new-order');
      socket.off('order-updated');
    };
  }, []);

  const fetchOrdersByDate = async (date: Date, period: 'day' | 'week' | 'month' | 'year' = 'day') => {
    setIsHistoryLoading(true);
    setSelectedDate(date);

    try {
      let formattedDate = format(date, 'yyyy-MM-dd');
      if (period === 'month') formattedDate = format(date, 'yyyy-MM');
      if (period === 'year') formattedDate = format(date, 'yyyy');

      const data = await api.getHistory(period, formattedDate);
      setDailyOrders(data);
    } catch (error) {
      console.error('Error fetching daily orders:', error);
      setDailyOrders([]);
    }
    setIsHistoryLoading(false);
  };

  // Save on changes (individual effects)
  useEffect(() => {
    if (isLoaded) storage.saveCategories(categories);
  }, [categories, isLoaded]);

  const restoreDatabase = (data: any) => {
    // 1. Persistencia inmediata y forzada para evitar fallos de renderizado
    if (data.products) storage.saveProducts(data.products);
    if (data.categories) storage.saveCategories(data.categories);
    if (data.orders) storage.saveOrders(data.orders);
    if (data.restaurantName) storage.saveRestaurantName(data.restaurantName);
    if (data.eventType) storage.saveEventType(data.eventType);

    // 2. Actualización de estado de React para reflejar en UI
    setProducts(data.products || []);
    setCategories(data.categories || []);
    setOrders(data.orders || []);
    setRestaurantName(data.restaurantName || 'Mi Restaurante');
    setEventType(data.eventType || 'Evento Gastronómico');
    
    // 3. Limpiar carrito para evitar conflictos con productos viejos
    setCart([]);
    
    console.log("Base de datos restaurada correctamente en el estado global.");
  };

  const pendingCount = useMemo(() => 
    orders.filter(o => o.status === 'pending').length, 
  [orders]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, note: '' }];
    });
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateCartNote = (id: string, note: string) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, note } : item
    ));
  };

  const createOrder = async (client: string, table: string, payment: PaymentMethod) => {
    if (cart.length === 0) return;

    const finalClient = client.trim() === '' ? 'Mostrador' : client;
    const finalTable = table.trim() === '' ? 'Mostrador' : table;
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const orderId = editingOrderId || crypto.randomUUID();

    try {
      const orderData: Partial<Order> = {
        id: orderId,
        client: finalClient,
        table: finalTable,
        payment,
        status: 'pending',
        total,
        items: cart,
      };

      await api.createOrder(orderData);
      // State will be updated via socket listener 'new-order'
    } catch (error) {
      console.error('Error creating order:', error);
    }

    setCart([]);
    setView('dispatch');
    setEditingOrderId(null);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus, estimatedReadyAt?: string) => {
    try {
      await api.updateOrderStatus(orderId, status, estimatedReadyAt);
      // State will be updated via socket listener 'order-updated'
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const loadOrderForEditing = (orderId: string) => {
    const order = dailyOrders.find(o => o.id === orderId);
    if (order) {
      setCart(order.items);
      setEditingOrderId(order.id);
      setView('pos');
    }
  };

  const handleUpdateSettings = (name: string, type: string) => {
    setRestaurantName(name);
    setEventType(type);
    storage.saveRestaurantName(name);
    storage.saveEventType(type);
  };

  const handleCloseShift = async () => {
    try {
      await api.closeShift();
      setOrders([]); // Clear pending orders in kitchen
      await fetchOrdersByDate(new Date()); // Refresh history
      alert('Turno cerrado exitosamente. Los reportes han sido actualizados.');
    } catch (error) {
      console.error('Error closing shift:', error);
      alert('Error al cerrar el turno.');
    }
  };

  if (!isLoaded) {
    return (
      <div className="h-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin text-red-600"><Icons.Settings /></div>
          <p className="font-black uppercase tracking-widest text-xs">Iniciando Sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <header className="bg-black text-white shadow-md flex-shrink-0 z-10 no-print border-b border-red-600">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              className="lg:hidden text-white"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Open menu"
            >
              <Icons.Menu />
            </button>
            <span className="text-red-600">
              <Icons.ChefHat />
            </span>
            <div className="leading-tight">
              <h1 className="text-lg font-black tracking-tighter uppercase whitespace-nowrap">{restaurantName}</h1>
              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{eventType}</p>
            </div>
          </div>
          
          <nav className="hidden lg:flex space-x-1 sm:space-x-2">
            {[
              { id: 'pos', icon: <Icons.Cart />, label: 'Venta' },
              { id: 'dispatch', icon: <Icons.ChefHat />, label: 'Cocina', badge: pendingCount },
              { id: 'history', icon: <Icons.History />, label: 'Historial' },
              { id: 'settings', icon: <Icons.Settings />, label: 'Config' }
            ].map((btn) => (
              <button 
                key={btn.id}
                onClick={() => setView(btn.id as ViewState)}
                className={`flex flex-col sm:flex-row items-center sm:space-x-2 px-3 py-1 rounded transition-all duration-200 relative ${
                  view === btn.id 
                  ? 'bg-red-600 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {btn.icon}
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">{btn.label}</span>
                {btn.badge !== undefined && btn.badge > 0 && (
                  <span className="absolute -top-1 -right-1 sm:static sm:ml-2 bg-white text-black text-[10px] font-black px-1.5 py-0.5 rounded-full ring-2 ring-black sm:ring-0 animate-pulse">
                    {btn.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Slide-out menu */}
      <div
        className={`fixed inset-0 z-30 transition-opacity duration-300 ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMenuOpen(false)}
        ></div>
        <div
          className={`relative w-64 h-full bg-black text-white shadow-xl transform transition-transform duration-300 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-4">
            <h2 className="text-2xl font-bold">Menu</h2>
            <nav className="mt-8 flex flex-col space-y-2">
            {[
              { id: 'pos', icon: <Icons.Cart />, label: 'Venta' },
              { id: 'dispatch', icon: <Icons.ChefHat />, label: 'Cocina', badge: pendingCount },
              { id: 'history', icon: <Icons.History />, label: 'Historial' },
              { id: 'settings', icon: <Icons.Settings />, label: 'Config' }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setView(btn.id as ViewState)
                  setIsMenuOpen(false)
                }}
                className={`flex items-center space-x-3 p-3 rounded transition-all duration-200 ${
                  view === btn.id
                  ? 'bg-red-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                {btn.icon}
                <span className="font-bold">{btn.label}</span>
                {btn.badge !== undefined && btn.badge > 0 && (
                  <span className="ml-auto bg-white text-black text-xs font-bold px-2 py-1 rounded-full">
                    {btn.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
          </div>
        </div>
      </div>

      <main className="flex-grow overflow-auto">
        <div className="h-full">
          {view === 'pos' && (
            <POSView 
              products={products}
              categories={categories}
              cart={cart} 
              activeOrders={orders}
              onAddToCart={addToCart} 
              onUpdateQuantity={updateCartQuantity}
              onUpdateNote={updateCartNote}
              onCheckout={createOrder}
              onUpdateStatus={updateOrderStatus}
            />
          )}
          {view === 'dispatch' && (
            <DispatchView 
              orders={orders} 
              onUpdateStatus={updateOrderStatus}
              restaurantName={restaurantName}
            />
          )}
          {view === 'history' && (
            <HistoryView
              orders={dailyOrders}
              restaurantName={restaurantName}
              selectedDate={selectedDate}
              onDateChange={fetchOrdersByDate}
              isLoading={isHistoryLoading}
              onEditOrder={loadOrderForEditing}
            />
          )}
          {view === 'settings' && (
            <ProductManagement 
              products={products} 
              setProducts={setProducts}
              categories={categories}
              setCategories={setCategories}
              orders={orders}
              setOrders={setOrders}
              restaurantName={restaurantName}
              eventType={eventType}
              onUpdateSettings={handleUpdateSettings}
              onRestoreDatabase={restoreDatabase}
              onCloseShift={handleCloseShift}
            />
          )}
        </div>
      </main>
      
      <footer className="bg-black text-slate-500 border-t border-red-900 text-center py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] no-print safe-bottom">
        Sistema POS - Red & Black Edition - {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;
