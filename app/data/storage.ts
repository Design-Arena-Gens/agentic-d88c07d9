import { User, Customer, Product, RawMaterial, Order, Expense } from '../types';

// Initialize data from localStorage or use defaults
const isBrowser = typeof window !== 'undefined';

function getStorageData<T>(key: string, defaultValue: T): T {
  if (!isBrowser) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorageData<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// Default users
const defaultUsers: User[] = [
  { id: '1', username: 'admin', role: 'admin', name: 'Admin User' },
  { id: '2', username: 'staff', role: 'staff', name: 'Staff Member' },
  { id: '3', username: 'accountant', role: 'accountant', name: 'Accountant' },
];

// Default products (Khakhra varieties)
const defaultProducts: Product[] = [
  { id: '1', name: 'Plain Khakhra', category: 'Regular', price: 120, cost: 60, stock: 500, unit: 'pack', lowStockThreshold: 100 },
  { id: '2', name: 'Methi Khakhra', category: 'Flavored', price: 140, cost: 70, stock: 400, unit: 'pack', lowStockThreshold: 100 },
  { id: '3', name: 'Jeera Khakhra', category: 'Flavored', price: 140, cost: 70, stock: 350, unit: 'pack', lowStockThreshold: 100 },
  { id: '4', name: 'Masala Khakhra', category: 'Flavored', price: 150, cost: 75, stock: 450, unit: 'pack', lowStockThreshold: 100 },
  { id: '5', name: 'Garlic Khakhra', category: 'Flavored', price: 150, cost: 75, stock: 300, unit: 'pack', lowStockThreshold: 100 },
  { id: '6', name: 'Pizza Khakhra', category: 'Premium', price: 180, cost: 90, stock: 200, unit: 'pack', lowStockThreshold: 80 },
  { id: '7', name: 'Pani Puri Khakhra', category: 'Premium', price: 180, cost: 90, stock: 180, unit: 'pack', lowStockThreshold: 80 },
  { id: '8', name: 'Pudina Khakhra', category: 'Flavored', price: 140, cost: 70, stock: 250, unit: 'pack', lowStockThreshold: 100 },
];

// Default raw materials
const defaultRawMaterials: RawMaterial[] = [
  { id: '1', name: 'Wheat Flour', quantity: 500, unit: 'kg', costPerUnit: 40, supplier: 'Grain Traders', lowStockThreshold: 100 },
  { id: '2', name: 'Cooking Oil', quantity: 200, unit: 'liters', costPerUnit: 150, supplier: 'Oil Suppliers', lowStockThreshold: 50 },
  { id: '3', name: 'Salt', quantity: 50, unit: 'kg', costPerUnit: 20, supplier: 'Spice Mart', lowStockThreshold: 10 },
  { id: '4', name: 'Cumin Seeds', quantity: 30, unit: 'kg', costPerUnit: 400, supplier: 'Spice Mart', lowStockThreshold: 10 },
  { id: '5', name: 'Fenugreek Leaves', quantity: 15, unit: 'kg', costPerUnit: 500, supplier: 'Spice Mart', lowStockThreshold: 5 },
  { id: '6', name: 'Spice Mix', quantity: 40, unit: 'kg', costPerUnit: 300, supplier: 'Spice Mart', lowStockThreshold: 10 },
  { id: '7', name: 'Garlic Powder', quantity: 20, unit: 'kg', costPerUnit: 600, supplier: 'Spice Mart', lowStockThreshold: 5 },
  { id: '8', name: 'Packaging Material', quantity: 1000, unit: 'pieces', costPerUnit: 5, supplier: 'Pack Solutions', lowStockThreshold: 200 },
];

// Default customers
const defaultCustomers: Customer[] = [
  { id: '1', name: 'Rajesh Patel', email: 'rajesh@example.com', phone: '9876543210', address: '123 MG Road, Ahmedabad, Gujarat 380001', gstNumber: '24AAAAA0000A1Z5' },
  { id: '2', name: 'Priya Shah', email: 'priya@example.com', phone: '9876543211', address: '456 SG Highway, Ahmedabad, Gujarat 380015' },
  { id: '3', name: 'Mumbai Retail Store', email: 'orders@mumbaistore.com', phone: '9876543212', address: '789 Linking Road, Mumbai, Maharashtra 400050', gstNumber: '27BBBBB1111B1Z5' },
  { id: '4', name: 'Delhi Supermart', email: 'delhi@example.com', phone: '9876543213', address: '321 Connaught Place, New Delhi 110001', gstNumber: '07CCCCC2222C1Z5' },
];

// Storage class
export class DataStorage {
  private static instance: DataStorage;

  private constructor() {}

  static getInstance(): DataStorage {
    if (!DataStorage.instance) {
      DataStorage.instance = new DataStorage();
    }
    return DataStorage.instance;
  }

  // Users
  getUsers(): User[] {
    return defaultUsers;
  }

  // Customers
  getCustomers(): Customer[] {
    return getStorageData('customers', defaultCustomers);
  }

  saveCustomers(customers: Customer[]): void {
    setStorageData('customers', customers);
  }

  addCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    customers.push(customer);
    this.saveCustomers(customers);
  }

  updateCustomer(customer: Customer): void {
    const customers = this.getCustomers();
    const index = customers.findIndex(c => c.id === customer.id);
    if (index !== -1) {
      customers[index] = customer;
      this.saveCustomers(customers);
    }
  }

  deleteCustomer(id: string): void {
    const customers = this.getCustomers().filter(c => c.id !== id);
    this.saveCustomers(customers);
  }

  // Products
  getProducts(): Product[] {
    return getStorageData('products', defaultProducts);
  }

  saveProducts(products: Product[]): void {
    setStorageData('products', products);
  }

  addProduct(product: Product): void {
    const products = this.getProducts();
    products.push(product);
    this.saveProducts(products);
  }

  updateProduct(product: Product): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
      this.saveProducts(products);
    }
  }

  deleteProduct(id: string): void {
    const products = this.getProducts().filter(p => p.id !== id);
    this.saveProducts(products);
  }

  // Raw Materials
  getRawMaterials(): RawMaterial[] {
    return getStorageData('rawMaterials', defaultRawMaterials);
  }

  saveRawMaterials(materials: RawMaterial[]): void {
    setStorageData('rawMaterials', materials);
  }

  addRawMaterial(material: RawMaterial): void {
    const materials = this.getRawMaterials();
    materials.push(material);
    this.saveRawMaterials(materials);
  }

  updateRawMaterial(material: RawMaterial): void {
    const materials = this.getRawMaterials();
    const index = materials.findIndex(m => m.id === material.id);
    if (index !== -1) {
      materials[index] = material;
      this.saveRawMaterials(materials);
    }
  }

  deleteRawMaterial(id: string): void {
    const materials = this.getRawMaterials().filter(m => m.id !== id);
    this.saveRawMaterials(materials);
  }

  // Orders
  getOrders(): Order[] {
    return getStorageData('orders', []);
  }

  saveOrders(orders: Order[]): void {
    setStorageData('orders', orders);
  }

  addOrder(order: Order): void {
    const orders = this.getOrders();
    orders.unshift(order);
    this.saveOrders(orders);

    // Update product stock
    const products = this.getProducts();
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        product.stock -= item.quantity;
      }
    });
    this.saveProducts(products);
  }

  updateOrder(order: Order): void {
    const orders = this.getOrders();
    const index = orders.findIndex(o => o.id === order.id);
    if (index !== -1) {
      orders[index] = order;
      this.saveOrders(orders);
    }
  }

  deleteOrder(id: string): void {
    const orders = this.getOrders().filter(o => o.id !== id);
    this.saveOrders(orders);
  }

  // Expenses
  getExpenses(): Expense[] {
    return getStorageData('expenses', []);
  }

  saveExpenses(expenses: Expense[]): void {
    setStorageData('expenses', expenses);
  }

  addExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    expenses.unshift(expense);
    this.saveExpenses(expenses);
  }

  updateExpense(expense: Expense): void {
    const expenses = this.getExpenses();
    const index = expenses.findIndex(e => e.id === expense.id);
    if (index !== -1) {
      expenses[index] = expense;
      this.saveExpenses(expenses);
    }
  }

  deleteExpense(id: string): void {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this.saveExpenses(expenses);
  }

  // Reset all data
  resetData(): void {
    if (!isBrowser) return;
    localStorage.clear();
  }
}

export const storage = DataStorage.getInstance();
