import { useState, useRef } from 'react';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Printer } from 'lucide-react';
import { InventoryItem } from '@/api/stock';

interface BarcodeGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
}

export const BarcodeGeneratorModal = ({ isOpen, onClose, items }: BarcodeGeneratorModalProps) => {
  const [format, setFormat] = useState<'code128' | 'qrcode' | 'public_qr'>('code128');
  const [labelSize, setLabelSize] = useState<'standard' | 'small' | 'large'>('standard');
  const [copies, setCopies] = useState<number>(1);
  
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle: `
      @page {
        size: auto;
        margin: 5mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
      }
    `,
  });

  const getInternalUrl = (item: InventoryItem) => {
    const origin = window.location.origin;
    return `${origin}/inventory?sku=${encodeURIComponent(item.sku)}`;
  };

  const getPublicUrl = (item: InventoryItem) => {
    const origin = window.location.origin;
    return `${origin}/p/${item.tenant_id}/${item.id}`;
  };

  if (!isOpen || items.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Print Labels</DialogTitle>
          <DialogDescription>
            Configure and print barcodes or QR codes for {items.length} item(s).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Settings Panel */}
          <div className="space-y-4 col-span-1 border-r pr-6">
            <div className="space-y-2">
              <Label>Barcode Format</Label>
              <Select value={format} onValueChange={(val: any) => setFormat(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code128">Standard Barcode (Code 128)</SelectItem>
                  <SelectItem value="qrcode">Internal QR Code (URL Link)</SelectItem>
                  <SelectItem value="public_qr">Public QR Code (Customer Facing)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Label Size</Label>
              <Select value={labelSize} onValueChange={(val: any) => setLabelSize(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (30x15mm)</SelectItem>
                  <SelectItem value="standard">Standard (50x25mm)</SelectItem>
                  <SelectItem value="large">Large (100x50mm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Copies per Item</Label>
              <Input 
                type="number" 
                min={1} 
                max={100} 
                value={copies} 
                onChange={(e) => setCopies(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="pt-4">
              <Button onClick={handlePrint} className="w-full" size="lg">
                <Printer className="w-4 h-4 mr-2" />
                Print Labels
              </Button>
            </div>
          </div>

          {/* Preview Panel & Print Area */}
          <div className="col-span-2 bg-slate-100 rounded-md p-4 overflow-auto max-h-[60vh]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Live Preview</span>
            </div>
            
            <div className="bg-white p-8 border border-slate-200 shadow-sm" style={{ minHeight: '400px' }}>
              <div 
                ref={printRef} 
                className="print-container flex flex-wrap gap-4"
              >
                {items.map(item => {
                   return Array.from({ length: copies }).map((_, i) => (
                      <div 
                        key={`${item.id}-${i}`} 
                        className="flex flex-col items-center justify-center border border-dashed border-gray-300 p-2 bg-white"
                        style={{
                          width: labelSize === 'small' ? '120px' : labelSize === 'standard' ? '200px' : '350px',
                          height: labelSize === 'small' ? '60px' : labelSize === 'standard' ? '100px' : '180px',
                          overflow: 'hidden',
                          pageBreakInside: 'avoid'
                        }}
                      >
                        <div className="text-[10px] font-bold text-center truncate w-full px-1 mb-1">
                          {item.name}
                        </div>
                        
                        {format === 'code128' ? (
                          <div className="scale-75 origin-top flex flex-col items-center">
                            <Barcode 
                              value={item.sku} 
                              format="CODE128"
                              width={1.5}
                              height={40}
                              fontSize={12}
                              margin={0}
                              displayValue={true}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <QRCodeSVG 
                              value={format === 'public_qr' ? getPublicUrl(item) : getInternalUrl(item)} 
                              size={labelSize === 'small' ? 30 : labelSize === 'standard' ? 60 : 120} 
                            />
                            <div className="text-[8px] mt-1 text-gray-500">{item.sku}</div>
                          </div>
                        )}
                      </div>
                   ));
                })}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
