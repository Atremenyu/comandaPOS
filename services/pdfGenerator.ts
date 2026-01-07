
import { Order } from '../types';

export const generateTicketPDF = (order: Order, restaurantName: string = 'MI RESTAURANTE') => {
  // Accessing jsPDF from global scope since it's loaded via CDN
  const { jsPDF } = (window as any).jspdf;
  
  // Calculate height needed: base + items + notes
  const noteLinesCount = order.items.filter(i => i.note).length;
  const dynamicHeight = 150 + (order.items.length * 7) + (noteLinesCount * 4);

  // Create 80mm wide PDF
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, dynamicHeight], 
  });

  const centerX = 40;
  let y = 10;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(restaurantName.toUpperCase(), centerX, y, { align: 'center' });
  y += 6;
  doc.setFontSize(10);
  doc.text('TICKET DE VENTA', centerX, y, { align: 'center' });
  y += 10;

  // Info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`ID: ${order.id.slice(-8)}`, 5, y);
  y += 4;
  doc.text(`Fecha: ${new Date(order.date).toLocaleString()}`, 5, y);
  y += 4;
  doc.text(`Cliente: ${order.client || 'Mostrador'}`, 5, y);
  y += 4;
  doc.text(`Mesa: ${order.table || 'N/A'}`, 5, y);
  y += 6;

  // Table header
  doc.setLineWidth(0.2);
  doc.line(5, y, 75, y);
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('Item', 5, y);
  doc.text('Cant', 55, y);
  doc.text('Total', 65, y);
  y += 3;
  doc.line(5, y, 75, y);
  y += 5;

  // Items
  doc.setFont('helvetica', 'normal');
  order.items.forEach((item) => {
    doc.setFontSize(8);
    const name = item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name;
    doc.text(name, 5, y);
    doc.text(item.quantity.toString(), 57, y);
    doc.text(`$${(item.price * item.quantity).toFixed(0)}`, 65, y);
    y += 5;

    if (item.note) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.text(`>> ${item.note}`, 7, y);
      doc.setFont('helvetica', 'normal');
      y += 4;
    }
  });

  y += 2;
  doc.line(5, y, 75, y);
  y += 6;

  // Totals
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 5, y);
  doc.text(`$${order.total.toFixed(0)}`, 65, y);
  y += 6;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Metodo Pago: ${order.payment}`, 5, y);

  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('¡GRACIAS POR SU COMPRA!', centerX, y, { align: 'center' });

  doc.save(`ticket_${order.id.slice(-8)}.pdf`);
};
