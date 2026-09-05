import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { formatMoney, formatUnitPrice } from "@/utils/price";

import type { ProductHistoryPoint } from "@/hooks/useProductHistory";


interface ProductHistoryTableProps {
  data: ProductHistoryPoint[];
  currency: string;
  unit: string | null;
}


export function ProductHistoryTable({
  data,
  currency,
  unit,
}: ProductHistoryTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Price history</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No price history available.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Unit</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {[...data].reverse().map(item => (
                <TableRow key={item.period}>
                  <TableCell>{item.period}</TableCell>

                  <TableCell className="font-medium tabular-nums">
                    {formatMoney(item.price, currency)}
                  </TableCell>

                  <TableCell className="font-medium tabular-nums">
                    {formatUnitPrice(item.unitPrice, currency, unit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}