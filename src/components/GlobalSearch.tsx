import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, User, Package, Receipt, X } from 'lucide-react';
import { searchService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { cn, formatCurrency } from '@/lib/utils';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchService.globalSearch(query);
        setResults(response.data);
        setIsOpen(true);
      } catch (error) {
        console.error('Search failed', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (type: string, id: string) => {
    setIsOpen(false);
    setQuery('');
    if (type === 'customer') navigate(`/app/customers?id=${id}`);
    if (type === 'item') navigate(`/app/inventory?id=${id}`);
    if (type === 'bill') navigate(`/app/billing?id=${id}`);
  };

  return (
    <div className="relative w-full max-w-md group" ref={dropdownRef}>
      <div className="relative">
        <Search className={cn(
          "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
          isOpen ? "text-blue-500" : "text-gray-400 group-focus-within:text-blue-500"
        )} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder="Search customers, items, bills..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-10 py-2 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 outline-none transition-all"
        />
        {query && (
          <button 
            onClick={() => { setQuery(''); setResults(null); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-[60]"
          >
          <div className="max-h-[400px] overflow-y-auto">
            {/* Customers Section */}
            {results.customers.length > 0 && (
              <div className="p-2">
                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customers</p>
                {results.customers.map((c: any) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect('customer', c.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/50 rounded-xl transition-colors group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.phone}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Items Section */}
            {results.items.length > 0 && (
              <div className="p-2 border-t border-gray-50">
                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Items</p>
                {results.items.map((i: any) => (
                  <button
                    key={i.id}
                    onClick={() => handleSelect('item', i.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/50 rounded-xl transition-colors group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Package size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{i.name}</p>
                      <p className="text-xs text-gray-400">{i.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(i.price)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Bills Section */}
            {results.bills.length > 0 && (
              <div className="p-2 border-t border-gray-50">
                <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Bills</p>
                {results.bills.map((b: any) => (
                  <button
                    key={b.id}
                    onClick={() => handleSelect('bill', b.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50/50 rounded-xl transition-colors group text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center">
                      <Receipt size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{b.customer_name}</p>
                      <p className="text-[10px] font-mono text-gray-400">Bill #{b.bill_number}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(b.total_amount)}</span>
                  </button>
                ))}
              </div>
            )}

            {loading && (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                <p className="text-xs text-gray-400">Searching...</p>
              </div>
            )}

            {!loading && results.customers.length === 0 && results.items.length === 0 && results.bills.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-400">No results found for "{query}"</p>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
