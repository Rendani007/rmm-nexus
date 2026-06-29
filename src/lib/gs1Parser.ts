export interface GS1Data {
  gtin?: string;
  batch?: string;
  expiry?: string; // YYMMDD
  quantity?: number;
  serial?: string;
  raw?: string;
}

/**
 * Very basic GS1-128 parser.
 * Note: Real GS1 parsing is complex due to variable length AIs and FNC1 characters.
 * This handles common fixed-length AIs (01, 17) and extracts trailing variable length AIs (10, 30, 21)
 * if they are at the end, or uses simple string matching if there's no FNC1 separator.
 */
export const parseGS1 = (barcode: string): GS1Data | null => {
  // A standard GS1-128 barcode often starts with ]C1 but scanners might strip it.
  // We'll look for standard Application Identifiers (AI)
  let data: GS1Data = { raw: barcode };
  let remaining = barcode.replace(/^\]C1/, ''); // Strip symbology identifier if present

  // If it doesn't even look like it has AIs (like a 12-digit UPC), return null
  if (remaining.length <= 14 && !remaining.startsWith('01')) {
    return null;
  }

  try {
    while (remaining.length > 0) {
      if (remaining.startsWith('01')) {
        // GTIN is exactly 14 digits
        data.gtin = remaining.substring(2, 16);
        remaining = remaining.substring(16);
      } else if (remaining.startsWith('17')) {
        // Expiry date is exactly 6 digits (YYMMDD)
        data.expiry = remaining.substring(2, 8);
        remaining = remaining.substring(8);
      } else if (remaining.startsWith('10')) {
        // Batch/Lot is variable length up to 20 alphanumeric
        // If it's the last AI, it takes the rest. If there's an FNC1 (Group Separator char code 29), we'd split.
        // For simplicity, we assume it's separated by a non-alphanumeric or takes the rest.
        const match = remaining.substring(2).match(/^([A-Za-z0-9_-]+)/);
        if (match) {
            // Find if there's a known AI immediately following the batch if no separator exists
            // This is a naive approach. A real GS1 string without separators is ambiguous for variable fields.
            // Usually scanners send a group separator (\x1D) after variable length fields.
            const gsIndex = remaining.indexOf(String.fromCharCode(29));
            if (gsIndex > -1) {
               data.batch = remaining.substring(2, gsIndex);
               remaining = remaining.substring(gsIndex + 1);
            } else {
               data.batch = remaining.substring(2);
               remaining = ""; // Consumes the rest
            }
        } else {
            remaining = "";
        }
      } else if (remaining.startsWith('30')) {
        // Quantity is variable up to 8 digits
        const gsIndex = remaining.indexOf(String.fromCharCode(29));
        if (gsIndex > -1) {
            data.quantity = parseInt(remaining.substring(2, gsIndex), 10);
            remaining = remaining.substring(gsIndex + 1);
        } else {
            data.quantity = parseInt(remaining.substring(2), 10);
            remaining = "";
        }
      } else if (remaining.startsWith('21')) {
         // Serial number variable up to 20
         const gsIndex = remaining.indexOf(String.fromCharCode(29));
         if (gsIndex > -1) {
             data.serial = remaining.substring(2, gsIndex);
             remaining = remaining.substring(gsIndex + 1);
         } else {
             data.serial = remaining.substring(2);
             remaining = "";
         }
      }
      else {
        // Unknown AI or malformed string, break to avoid infinite loop
        break;
      }
    }
  } catch (e) {
     console.error("GS1 Parse Error", e);
  }

  // If we found at least a GTIN and it was actually parsed out
  if (data.gtin) {
      // Strip leading zeros from GTIN to match standard UPC/EAN if they are padded
      // Usually GTIN-14 pads 12-digit UPCs with two leading zeros.
      if (data.gtin.startsWith('00') && data.gtin.length === 14) {
          data.gtin = data.gtin.substring(2);
      } else if (data.gtin.startsWith('0') && data.gtin.length === 14) {
          data.gtin = data.gtin.substring(1);
      }
      return data;
  }

  return null;
};
