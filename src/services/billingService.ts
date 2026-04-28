import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  serverTimestamp, 
  runTransaction 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Bill, BillItem, PaymentStatus, Customer } from '../types';

export const billingService = {
  async createBill(billData: Omit<Bill, 'id'>, items: Omit<BillItem, 'id' | 'billId'>[]) {
    return await runTransaction(db, async (transaction) => {
      // 1. Create the Bill
      const billRef = doc(collection(db, 'bills'));
      const billPayload = {
        ...billData,
        createdAt: serverTimestamp(),
      };
      transaction.set(billRef, billPayload);

      // 2. Add Bill Items
      for (const item of items) {
        const itemRef = doc(collection(db, `bills/${billRef.id}/items`));
        transaction.set(itemRef, {
          ...item,
          billId: billRef.id,
        });

        // 3. Update Inventory Stock
        const originalItemRef = doc(db, 'items', item.itemId);
        transaction.update(originalItemRef, {
          stock: increment(-item.quantity)
        });
      }

      // 4. Update Customer Dues and Totals
      const customerRef = doc(db, 'customers', billData.customerId);
      transaction.update(customerRef, {
        outstandingDue: increment(billData.dueAmount),
        totalPurchases: increment(billData.total),
        lastPurchaseDate: new Date().toISOString()
      });

      return billRef.id;
    });
  }
};

export const customerService = {
  async addPayment(customerId: string, amount: number, mode: string, billId?: string) {
    return await runTransaction(db, async (transaction) => {
      const paymentRef = doc(collection(db, 'payments'));
      transaction.set(paymentRef, {
        customerId,
        amount,
        mode,
        billId,
        date: new Date().toISOString(),
        createdAt: serverTimestamp(),
      });

      const customerRef = doc(db, 'customers', customerId);
      transaction.update(customerRef, {
        outstandingDue: increment(-amount)
      });
      
      return paymentRef.id;
    });
  }
};
