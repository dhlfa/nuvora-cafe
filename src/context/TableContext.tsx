import React, { createContext, useContext, useState, useEffect } from 'react';
import { storageHelper, TableInfo } from '../utils/storage';

export type OrderType = 'dine_in' | 'delivery';

interface TableContextType {
  activeTable: TableInfo | null;
  setTable: (info: TableInfo | null) => void;
  isLoadingTable: boolean;
  orderType: OrderType;
  setOrderType: (type: OrderType) => void;
  isLockedToDineIn: boolean;
}

const TableContext = createContext<TableContextType | undefined>(undefined);

export const tableNumberToId = (tableNumber: string | number) => {
  const number = Number(tableNumber);
  if (!Number.isInteger(number) || number < 1) {
    return "";
  }
  return `TBL-${String(number).padStart(3, "0")}`;
};

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTable, setActiveTableState] = useState<TableInfo | null>(null);
  const [isLoadingTable, setIsLoadingTable] = useState(true);
  const [orderType, setOrderTypeState] = useState<OrderType>('delivery');
  const [isLockedToDineIn, setIsLockedToDineIn] = useState(false);

  const setTable = (info: TableInfo | null) => {
    if (info) {
      const table_number = info.table_number || Number(String(info.tableId || "").replace(/\D/g, '')) || 1;
      const table_id = info.table_id || tableNumberToId(table_number);
      const normalizedInfo: TableInfo = {
        table_number,
        table_id,
        tableId: table_id,
        tableName: `Meja ${table_number}`,
        token: info.token
      };
      setActiveTableState(normalizedInfo);
      storageHelper.setTableInfo(normalizedInfo);
    } else {
      setActiveTableState(null);
      storageHelper.setTableInfo(null);
    }
  };

  const setOrderType = (type: OrderType) => {
    if (isLockedToDineIn && type === 'delivery') {
      // Prevent unlocking if QR locked
      return;
    }
    setOrderTypeState(type);
    localStorage.setItem('nuvora_order_type', type);
  };

  useEffect(() => {
    // Check URL query parameters (from both window.location.search and window.location.hash)
    const getParam = (name: string) => {
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has(name)) return searchParams.get(name);
      
      const hashIndex = window.location.hash.indexOf('?');
      if (hashIndex !== -1) {
        const hashParams = new URLSearchParams(window.location.hash.slice(hashIndex));
        if (hashParams.has(name)) return hashParams.get(name);
      }
      return null;
    };

    const tableParam = getParam('table');
    const tokenParam = getParam('token');

    let initialOrderType: OrderType = 'delivery';
    let qrLocked = false;

    // Check if session storage has QR locked flag
    try {
      if (sessionStorage.getItem('nuvora_qr_locked') === 'true') {
        qrLocked = true;
      }
    } catch (e) {
      // Ignore
    }

    if (tableParam && tokenParam) {
      const table_number = Number(tableParam) || 1;
      const table_id = tableNumberToId(table_number);
      const tableInfo: TableInfo = {
        table_number,
        table_id,
        tableId: table_id,
        tableName: `Meja ${table_number}`,
        token: tokenParam
      };
      setTable(tableInfo);
      qrLocked = true;
      initialOrderType = 'dine_in';
      try {
        sessionStorage.setItem('nuvora_qr_locked', 'true');
      } catch (e) {}

      // Clear query params from URL without refreshing to keep it clean
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    } else {
      // Check localStorage for table
      const savedTable = storageHelper.getTableInfo();
      if (savedTable) {
        // Automatically migrate if old properties are missing
        const table_number = savedTable.table_number || Number(String(savedTable.tableId || "").replace(/\D/g, '')) || 1;
        const table_id = savedTable.table_id || tableNumberToId(table_number);
        const migrated: TableInfo = {
          table_number,
          table_id,
          tableId: table_id,
          tableName: `Meja ${table_number}`,
          token: savedTable.token || ""
        };
        setActiveTableState(migrated);
        storageHelper.setTableInfo(migrated);
        
        // If has saved table, dine_in could be the default if it's preferred
        if (qrLocked) {
          initialOrderType = 'dine_in';
        } else {
          const savedType = localStorage.getItem('nuvora_order_type') as OrderType;
          initialOrderType = savedType || 'dine_in';
        }
      } else {
        const savedType = localStorage.getItem('nuvora_order_type') as OrderType;
        initialOrderType = savedType || 'delivery';
      }
    }

    setIsLockedToDineIn(qrLocked);
    setOrderTypeState(qrLocked ? 'dine_in' : initialOrderType);
    setIsLoadingTable(false);
  }, []);

  return (
    <TableContext.Provider value={{ activeTable, setTable, isLoadingTable, orderType, setOrderType, isLockedToDineIn }}>
      {children}
    </TableContext.Provider>
  );
};

export const useTable = () => {
  const context = useContext(TableContext);
  if (context === undefined) {
    throw new Error('useTable must be used within a TableProvider');
  }
  return context;
};
