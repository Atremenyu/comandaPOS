
import { Product, Order, Category } from '../types';

const KEYS = {
  PRODUCTS: 'comanda_productos',
  ORDERS: 'comanda_ordenes',
  CATEGORIES: 'comanda_categorias',
  RESTAURANT_NAME: 'comanda_restaurant_name',
  EVENT_TYPE: 'comanda_event_type',
};

export const storage = {
  getProducts: (): Product[] => {
    const data = localStorage.getItem(KEYS.PRODUCTS);
    return data ? JSON.parse(data) : [];
  },
  saveProducts: (products: Product[]) => {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  },
  getOrders: (): Order[] => {
    const data = localStorage.getItem(KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },
  saveOrders: (orders: Order[]) => {
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  },
  getCategories: (): Category[] => {
    const data = localStorage.getItem(KEYS.CATEGORIES);
    return data ? JSON.parse(data) : [];
  },
  saveCategories: (categories: Category[]) => {
    localStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
  },
  getRestaurantName: (): string => {
    return localStorage.getItem(KEYS.RESTAURANT_NAME) || 'Mi Restaurante';
  },
  saveRestaurantName: (name: string) => {
    localStorage.setItem(KEYS.RESTAURANT_NAME, name);
  },
  getEventType: (): string => {
    return localStorage.getItem(KEYS.EVENT_TYPE) || 'Evento Gastronómico';
  },
  saveEventType: (type: string) => {
    localStorage.setItem(KEYS.EVENT_TYPE, type);
  },
};
