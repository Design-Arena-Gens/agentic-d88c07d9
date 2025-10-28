import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Order, Expense, Product, RawMaterial } from '../types';
import { format } from 'date-fns';

export function exportOrdersToPDF(orders: Order[], filename: string = 'orders.pdf') {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text('Orders Report', 14, 20);

  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);

  const tableData = orders.map(order => [
    order.id,
    format(new Date(order.createdAt), 'dd/MM/yyyy'),
    order.customerName,
    order.status,
    `₹${order.total.toFixed(2)}`,
    order.paymentStatus
  ]);

  autoTable(doc, {
    head: [['Order ID', 'Date', 'Customer', 'Status', 'Total', 'Payment']],
    body: tableData,
    startY: 35,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [102, 126, 234] }
  });

  doc.save(filename);
}

export function exportOrdersToExcel(orders: Order[], filename: string = 'orders.xlsx') {
  const data = orders.map(order => ({
    'Order ID': order.id,
    'Date': format(new Date(order.createdAt), 'dd/MM/yyyy HH:mm'),
    'Customer Name': order.customerName,
    'Customer Email': order.customerEmail,
    'Customer Phone': order.customerPhone,
    'Status': order.status,
    'Payment Method': order.paymentMethod,
    'Payment Status': order.paymentStatus,
    'Subtotal': order.subtotal,
    'GST Amount': order.gstAmount,
    'Total': order.total
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders');
  XLSX.writeFile(wb, filename);
}

export function generateInvoicePDF(order: Order) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(102, 126, 234);
  doc.text('KHAKHRA ENTERPRISE', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('123 Manufacturing Lane, Ahmedabad, Gujarat 380001', 105, 28, { align: 'center' });
  doc.text('Phone: +91 98765 43210 | Email: info@khakhra.com', 105, 34, { align: 'center' });
  doc.text('GSTIN: 24AAAAA1234A1Z5', 105, 40, { align: 'center' });

  // Invoice title
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text('TAX INVOICE', 105, 55, { align: 'center' });

  // Invoice details
  doc.setFontSize(10);
  doc.text(`Invoice No: INV-${order.id}`, 14, 70);
  doc.text(`Date: ${format(new Date(order.createdAt), 'dd/MM/yyyy')}`, 14, 76);
  doc.text(`Payment Status: ${order.paymentStatus.toUpperCase()}`, 14, 82);

  // Customer details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 14, 95);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(order.customerName, 14, 102);
  doc.text(order.customerPhone, 14, 108);
  if (order.customerGst) {
    doc.text(`GSTIN: ${order.customerGst}`, 14, 114);
  }

  const addressLines = doc.splitTextToSize(order.customerAddress, 80);
  doc.text(addressLines, 14, order.customerGst ? 120 : 114);

  // Items table
  const tableData = order.items.map(item => [
    item.productName,
    item.quantity.toString(),
    `₹${item.price.toFixed(2)}`,
    `₹${(item.quantity * item.price).toFixed(2)}`
  ]);

  autoTable(doc, {
    head: [['Product', 'Quantity', 'Rate', 'Amount']],
    body: tableData,
    startY: order.customerGst ? 135 : 125,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [102, 126, 234] },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // Totals
  doc.text('Subtotal:', 130, finalY);
  doc.text(`₹${order.subtotal.toFixed(2)}`, 190, finalY, { align: 'right' });

  doc.text(`GST (${order.gstRate}%):`, 130, finalY + 7);
  doc.text(`₹${order.gstAmount.toFixed(2)}`, 190, finalY + 7, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total:', 130, finalY + 16);
  doc.text(`₹${order.total.toFixed(2)}`, 190, finalY + 16, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Thank you for your business!', 105, finalY + 35, { align: 'center' });
  doc.text('For any queries, please contact us at info@khakhra.com', 105, finalY + 41, { align: 'center' });

  doc.save(`invoice-${order.id}.pdf`);
}

export function exportInventoryToExcel(
  products: Product[],
  rawMaterials: RawMaterial[],
  filename: string = 'inventory.xlsx'
) {
  const productsData = products.map(p => ({
    'Product Name': p.name,
    'Category': p.category,
    'Current Stock': p.stock,
    'Unit': p.unit,
    'Low Stock Threshold': p.lowStockThreshold,
    'Status': p.stock <= p.lowStockThreshold ? 'LOW' : 'OK',
    'Cost Price': p.cost,
    'Selling Price': p.price
  }));

  const materialsData = rawMaterials.map(m => ({
    'Material Name': m.name,
    'Current Quantity': m.quantity,
    'Unit': m.unit,
    'Low Stock Threshold': m.lowStockThreshold,
    'Status': m.quantity <= m.lowStockThreshold ? 'LOW' : 'OK',
    'Cost Per Unit': m.costPerUnit,
    'Supplier': m.supplier
  }));

  const wb = XLSX.utils.book_new();

  const wsProducts = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

  const wsMaterials = XLSX.utils.json_to_sheet(materialsData);
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'Raw Materials');

  XLSX.writeFile(wb, filename);
}

export function exportExpensesToExcel(expenses: Expense[], filename: string = 'expenses.xlsx') {
  const data = expenses.map(e => ({
    'Date': format(new Date(e.date), 'dd/MM/yyyy'),
    'Category': e.category,
    'Description': e.description,
    'Amount': e.amount,
    'Created By': e.createdBy,
    'Notes': e.notes || ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
  XLSX.writeFile(wb, filename);
}

export function exportProfitLossToPDF(
  revenue: number,
  cogs: number,
  expenses: number,
  period: string,
  filename: string = 'profit-loss.pdf'
) {
  const doc = new jsPDF();

  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses;
  const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  doc.setFontSize(20);
  doc.setTextColor(102, 126, 234);
  doc.text('Profit & Loss Statement', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(period, 105, 30, { align: 'center' });
  doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 105, 38, { align: 'center' });

  const data = [
    ['Revenue', `₹${revenue.toFixed(2)}`],
    ['Cost of Goods Sold (COGS)', `₹${cogs.toFixed(2)}`],
    ['Gross Profit', `₹${grossProfit.toFixed(2)}`],
    ['Operating Expenses', `₹${expenses.toFixed(2)}`],
    ['Net Profit', `₹${netProfit.toFixed(2)}`],
    ['Profit Margin', `${profitMargin.toFixed(2)}%`]
  ];

  autoTable(doc, {
    body: data,
    startY: 50,
    styles: { fontSize: 11, cellPadding: 8 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 100 },
      1: { halign: 'right', cellWidth: 70 }
    },
    theme: 'grid'
  });

  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(10);
  doc.setTextColor(80);

  if (netProfit >= 0) {
    doc.setTextColor(40, 167, 69);
    doc.text(`✓ Profitable period with ${profitMargin.toFixed(2)}% margin`, 14, finalY);
  } else {
    doc.setTextColor(220, 53, 69);
    doc.text(`✗ Loss-making period. Review expenses and pricing strategy.`, 14, finalY);
  }

  doc.save(filename);
}
