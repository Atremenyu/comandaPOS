
import React, { useState, useRef, useEffect } from 'react';
import { Product, Category, Order } from '../types';
import { Icons } from '../constants';

interface ProductManagementProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  restaurantName: string;
  eventType: string;
  onUpdateSettings: (name: string, type: string) => void;
  onRestoreDatabase: (data: any) => void;
}

interface BackupPreview {
  products: Product[];
  categories: Category[];
  orders: Order[];
  restaurantName: string;
  eventType: string;
  fileName: string;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ 
  products, 
  setProducts, 
  categories, 
  setCategories,
  orders,
  setOrders,
  restaurantName,
  eventType,
  onUpdateSettings,
  onRestoreDatabase
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'general'>('products');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General Settings Form
  const [formRestName, setFormRestName] = useState(restaurantName);
  const [formEventType, setFormEventType] = useState(eventType);

  // Backup Import State
  const [preview, setPreview] = useState<BackupPreview | null>(null);

  // Sync internal form with props when they change (critical for imports)
  useEffect(() => {
    setFormRestName(restaurantName);
    setFormEventType(eventType);
  }, [restaurantName, eventType]);

  // Product Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState<Category>('');

  // Category Form State
  const [newCatName, setNewCatName] = useState('');

  const handleSaveProduct = () => {
    if (!name || price <= 0 || !category) return;

    if (editingId) {
      setProducts(prev => prev.map(p => 
        p.id === editingId ? { ...p, name, price, category } : p
      ));
      setEditingId(null);
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name,
        price,
        category,
      };
      setProducts(prev => [...prev, newProduct]);
      setIsAdding(false);
    }
    resetProductForm();
  };

  const resetProductForm = () => {
    setName('');
    setPrice(0);
    setCategory(categories[0] || '');
  };

  const startEditProduct = (p: Product) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price);
    setCategory(p.category);
    setIsAdding(false);
  };

  const deleteProduct = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      alert('Esta categoría ya existe.');
      return;
    }
    setCategories(prev => [...prev, trimmed]);
    setNewCatName('');
  };

  const handleDeleteCategory = (cat: Category) => {
    const inUse = products.some(p => p.category === cat);
    if (inUse) {
      alert(`No se puede eliminar "${cat}" porque está siendo usada por algunos productos.`);
      return;
    }
    if (confirm(`¿Eliminar categoría "${cat}"?`)) {
      setCategories(prev => prev.filter(c => c !== cat));
    }
  };

  const handleSaveGeneral = () => {
    onUpdateSettings(formRestName, formEventType);
    alert('Configuración actualizada');
  };

  // BACKUP LOGIC
  const handleExportData = () => {
    const data = {
      products,
      categories,
      orders,
      restaurantName,
      eventType,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comanda_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validaciones básicas de estructura
        if (!data.products || !data.categories) {
          throw new Error("El archivo no es un respaldo válido de Comanda Eventos.");
        }

        setPreview({
          products: data.products || [],
          categories: data.categories || [],
          orders: data.orders || [],
          restaurantName: data.restaurantName || restaurantName,
          eventType: data.eventType || eventType,
          fileName: file.name
        });
      } catch (err) {
        console.error("Error al leer archivo:", err);
        alert('Error al procesar el archivo: ' + (err instanceof Error ? err.message : 'Formato inválido'));
        setPreview(null);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const applyBackup = () => {
    if (!preview) return;

    if (confirm('ATENCIÓN: Se borrarán todos los datos actuales y se reemplazarán por los del respaldo. ¿Continuar?')) {
      try {
        onRestoreDatabase(preview);
        alert('Base de datos restaurada con éxito.');
        setPreview(null);
        // Opcional: Volver a la pestaña de productos para ver el cambio
        setActiveTab('products');
      } catch (error) {
        console.error("Error durante applyBackup:", error);
        alert("Ocurrió un error al aplicar el respaldo.");
      }
    }
  };

  return (
    <div className="p-2 sm:p-6 max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex space-x-1 bg-slate-200 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeTab === 'products' ? 'bg-black text-white shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}
        >
          Productos
        </button>
        <button 
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeTab === 'categories' ? 'bg-black text-white shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}
        >
          Categorías
        </button>
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${activeTab === 'general' ? 'bg-black text-white shadow-sm' : 'text-slate-500 hover:bg-slate-300'}`}
        >
          General
        </button>
      </div>

      {activeTab === 'products' && (
        <>
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter">Menú de Ventas</h2>
            {!isAdding && !editingId && (
              <button 
                onClick={() => {
                  setIsAdding(true);
                  if (categories.length > 0) setCategory(categories[0]);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center space-x-2 hover:bg-red-700 transition shadow-lg shadow-red-100"
              >
                <Icons.Plus /> <span>Nuevo</span>
              </button>
            )}
          </div>

          {(isAdding || editingId) && (
            <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-2 border-red-600 shadow-xl animate-in zoom-in duration-200">
              <h3 className="font-black text-black uppercase tracking-widest mb-4 sm:mb-6 border-b pb-2 text-sm sm:text-base">{editingId ? 'Editar' : 'Agregar'} Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Item</label>
                  <input 
                    type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio</label>
                  <input 
                    type="number" value={price} onChange={e => setPrice(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-600 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</label>
                  <select 
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-600 outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3 gap-2 sm:gap-0">
                <button 
                  onClick={() => { setIsAdding(false); setEditingId(null); resetProductForm(); }}
                  className="w-full sm:w-auto px-6 py-3 sm:py-2 bg-slate-100 text-slate-700 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveProduct}
                  className="w-full sm:w-auto px-10 py-3 sm:py-2 bg-black text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg"
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Responsive Product List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            {/* Desktop Table */}
            <table className="w-full text-left hidden lg:table">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Item</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio</th>
                  <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-red-50/30 transition-colors">
                    <td className="p-4 font-bold text-slate-900 text-sm">{product.name}</td>
                    <td className="p-4">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded border border-slate-300 uppercase bg-white text-slate-600">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black text-black text-sm">${product.price}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end space-x-1">
                        <button onClick={() => startEditProduct(product)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Icons.Edit /></button>
                        <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition"><Icons.Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Card List */}
            <div className="divide-y divide-slate-100 lg:hidden">
              {products.map(product => (
                <div key={product.id} className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{product.name}</p>
                    <p className="text-xs font-bold text-black mt-1">${product.price}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button onClick={() => startEditProduct(product)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Icons.Edit /></button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 text-slate-400 hover:text-black hover:bg-slate-100 rounded-lg transition"><Icons.Trash /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter">Categorías</h2>
          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-4 sm:space-y-6">
            <div className="flex space-x-2">
              <input 
                type="text" 
                placeholder="Nueva categoría..."
                className="flex-grow p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-600 outline-none"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleAddCategory()}
              />
              <button 
                onClick={handleAddCategory}
                className="bg-black text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition shadow-lg"
              >
                <span>Añadir</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categories.map(cat => (
                <div key={cat} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 group transition hover:border-red-600 hover:bg-white">
                  <span className="font-bold text-slate-800 text-sm uppercase tracking-tight">{cat}</span>
                  <button 
                    onClick={() => handleDeleteCategory(cat)}
                    className="p-2 text-slate-300 hover:text-red-600 transition opacity-0 group-hover:opacity-100"
                  >
                    <Icons.Trash />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-400 pb-10">
          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter">Ajustes del Negocio</h2>
            <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border-2 border-black shadow-2xl space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Negocio</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3.5 text-red-600 opacity-50"><Icons.ChefHat /></div>
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-black outline-none font-black text-black"
                      value={formRestName}
                      onChange={e => setFormRestName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Evento</label>
                  <div className="relative">
                    <div className="absolute left-3 top-3.5 text-red-600 opacity-50"><Icons.MapPin /></div>
                    <input 
                      type="text" 
                      className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-50 border-0 ring-1 ring-slate-200 focus:ring-2 focus:ring-black outline-none font-bold text-slate-700"
                      value={formEventType}
                      onChange={e => setFormEventType(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-2 sm:pt-4 flex sm:justify-end">
                <button 
                  onClick={handleSaveGeneral}
                  className="w-full sm:w-auto bg-red-600 text-white px-8 sm:px-12 py-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-[0.2em] hover:bg-red-700 transition shadow-2xl shadow-red-200"
                >
                  Actualizar
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tighter">Respaldo de Datos</h2>
            <div className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={handleExportData}
                  className="flex-1 bg-black text-white px-6 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-900 transition shadow-xl flex flex-col items-center justify-center space-y-3"
                >
                  <div className="scale-150 mb-1"><Icons.FileText /></div>
                  <span>Exportar Base de Datos</span>
                </button>

                <div className="flex-1 relative">
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleFileSelect} 
                    className="hidden" 
                    ref={fileInputRef}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-full bg-slate-100 text-slate-700 px-6 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition border-2 border-dashed border-slate-300 flex flex-col items-center justify-center space-y-3"
                  >
                    <div className="scale-150 mb-1 rotate-180"><Icons.FileText /></div>
                    <span>Seleccionar Archivo</span>
                  </button>
                </div>
              </div>

              {/* PREVIEW AREA */}
              {preview && (
                <div className="mt-6 bg-slate-50 rounded-2xl sm:rounded-3xl border-2 border-red-600 p-4 sm:p-6 animate-in zoom-in duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-black text-black uppercase tracking-widest text-xs">Previsualización del Respaldo</h4>
                    <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-red-600 transition"><Icons.Trash /></button>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Archivo</p>
                      <p className="text-[10px] font-bold truncate">{preview.fileName}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Productos</p>
                      <p className="text-lg font-black">{preview.products.length}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Categorías</p>
                      <p className="text-lg font-black">{preview.categories.length}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Órdenes</p>
                      <p className="text-lg font-black">{preview.orders.length}</p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-xl border border-slate-200 mb-6">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ajustes a aplicar:</p>
                    <p className="text-[10px] font-black uppercase tracking-tight text-red-600">{preview.restaurantName} / {preview.eventType}</p>
                  </div>

                  <button 
                    onClick={applyBackup}
                    className="w-full bg-red-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center space-x-3 shadow-2xl shadow-red-200 hover:bg-red-700 transition"
                  >
                    <Icons.CheckCircle />
                    <span>APLICAR ESTE RESPALDO</span>
                  </button>
                </div>
              )}
              
              <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start space-x-3">
                <div className="text-red-600 pt-0.5 scale-90"><Icons.Settings /></div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-red-800 tracking-wider">¡Atención!</p>
                  <p className="text-[10px] text-red-700 leading-relaxed font-medium">
                    Use estas funciones para guardar su progreso. El sistema almacena datos localmente, por lo que limpiar la caché del navegador borrará su información si no tiene un respaldo.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
