import { Layout } from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowDown, ArrowUp, ArrowLeftRight, Clock } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import type { InventoryItem } from '@/types';
import type { GS1Data } from '@/lib/gs1Parser';

import { useStockPageData } from '@/features/stock/hooks/useStockPageData';
import { StockInForm } from '@/features/stock/components/StockInForm';
import { StockOutForm } from '@/features/stock/components/StockOutForm';
import { StockTransferForm } from '@/features/stock/components/StockTransferForm';
import { MovementHistoryTable } from '@/features/stock/components/MovementHistoryTable';

export const StockPage = () => {
  const { items, locations, loadingData } = useStockPageData();
  
  const locState = useLocation();
  const stateData = locState.state as { tab?: string, item?: InventoryItem, gs1Data?: GS1Data } | null;
  const defaultTab = stateData?.tab || 'in';

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Movements</h1>
          <p className="text-muted-foreground">Record stock in, out, and transfer transactions</p>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="in"><ArrowDown className="mr-2 h-4 w-4" />Stock In</TabsTrigger>
            <TabsTrigger value="out"><ArrowUp className="mr-2 h-4 w-4" />Stock Out</TabsTrigger>
            <TabsTrigger value="transfer"><ArrowLeftRight className="mr-2 h-4 w-4" />Transfer</TabsTrigger>
            <TabsTrigger value="history"><Clock className="mr-2 h-4 w-4" />History</TabsTrigger>
          </TabsList>

          <TabsContent value="in" className="mt-6">
            <StockInForm 
              items={items} 
              locations={locations} 
              loading={loadingData} 
              prefillItem={stateData?.item} 
              prefillGs1={stateData?.gs1Data} 
            />
          </TabsContent>

          <TabsContent value="out" className="mt-6">
            <StockOutForm items={items} locations={locations} loading={loadingData} />
          </TabsContent>

          <TabsContent value="transfer" className="mt-6">
            <StockTransferForm items={items} locations={locations} loading={loadingData} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
             <MovementHistoryTable />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};