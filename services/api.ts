
import axios from 'axios';
import { io } from 'socket.io-client';
import { Product, Order, Category, OrderStatus } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const socket = io(API_URL);

export const api = {
    // Products
    getProducts: async (): Promise<Product[]> => {
        const res = await axios.get(`${API_URL}/api/products`);
        return res.data;
    },
    addProduct: async (product: Product): Promise<Product> => {
        const res = await axios.post(`${API_URL}/api/products`, product);
        return res.data;
    },

    // Categories
    getCategories: async (): Promise<string[]> => {
        const res = await axios.get(`${API_URL}/api/categories`);
        return res.data;
    },
    addCategory: async (name: string): Promise<string> => {
        const res = await axios.post(`${API_URL}/api/categories`, { name });
        return res.data;
    },

    // Orders
    getActiveOrders: async (): Promise<Order[]> => {
        const res = await axios.get(`${API_URL}/api/orders/active-shift`);
        return res.data;
    },
    createOrder: async (order: Partial<Order>): Promise<Order> => {
        const res = await axios.post(`${API_URL}/api/orders`, order);
        return res.data;
    },
    updateOrderStatus: async (id: string, status: OrderStatus, estimatedReadyAt?: string): Promise<Order> => {
        const res = await axios.put(`${API_URL}/api/orders/${id}/status`, { status, estimated_ready_at: estimatedReadyAt });
        return res.data;
    },

    // Shifts
    closeShift: async () => {
        const res = await axios.post(`${API_URL}/api/shifts/close`);
        return res.data;
    },

    // Reports
    getHistory: async (period: 'day' | 'week' | 'month' | 'year', date: string): Promise<Order[]> => {
        const res = await axios.get(`${API_URL}/api/reports/history`, { params: { period, date } });
        return res.data;
    }
};
