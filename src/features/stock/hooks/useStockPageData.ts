import { useState, useEffect, useCallback } from 'react';
import { listItems } from '@/api/items';
import { listLocations } from '@/api/locations';
import type { InventoryItem, InventoryLocation } from '@/types';
import { toast } from '@/hooks/use-toast';

/** Why: backend may wrap arrays; normalize avoids .map crashes */
function normalizeArray<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const o = (payload ?? null) as Record<string, unknown> | null;
  if (!o) return [];
  if (Array.isArray(o.items)) return o.items as T[];
  if (Array.isArray(o.data)) return o.data as T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (Array.isArray((o as any).results)) return (o as any).results as T[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (Array.isArray((o as any).rows)) return (o as any).rows as T[];
  return [];
}

export const useStockPageData = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [locations, setLocations] = useState<InventoryLocation[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const loadData = useCallback(async () => {
        setLoadingData(true);
        try {
            const [itemsData, locationsData] = await Promise.all([listItems(), listLocations()]);
            const normItems = normalizeArray<InventoryItem>(itemsData);
            const normLocs = normalizeArray<InventoryLocation>(locationsData);
            setItems(normItems);
            setLocations(normLocs);
            if (!Array.isArray(itemsData) || !Array.isArray(locationsData)) {
                console.debug('Normalized non-array stock dependencies to arrays.');
            }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Failed to load data',
                description: error?.response?.data?.message || 'We could not load the stock data. Please try again later.',
            });
            setItems([]);
            setLocations([]);
        } finally {
            setLoadingData(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return { items, locations, loadingData };
};
