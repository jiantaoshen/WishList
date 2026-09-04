import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  PriceChartPoint,
} from "@/hooks/useProductHistory";


interface ProductPriceChartProps {
  title: string;
  description: string;

  data: PriceChartPoint[];

  currency: string;

  target: number | null;
}


export function ProductPriceChart({
  title,
  description,
  data,
  currency,
  target,
}: ProductPriceChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {title}
        </CardTitle>

        <p
          className="
            text-sm
            text-muted-foreground
          "
        >
          {description}
        </p>
      </CardHeader>


      <CardContent>
        {data.length === 0 ? (
          <div
            className="
              flex h-72
              items-center
              justify-center
              text-sm
              text-muted-foreground
            "
          >
            No history available.
          </div>
        ) : (
          <div className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={data}
                margin={{
                  top: 10,
                  right: 10,
                  bottom: 0,
                  left: 0,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis
                  dataKey="period"
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                  }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />

                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString(
                      "sv-SE",
                      {
                        maximumFractionDigits:
                          4,
                      },
                    )} ${currency}`,
                    "Price",
                  ]}
                />


                {target !== null && (
                  <ReferenceLine
                    y={target}
                    strokeDasharray="5 5"
                  />
                )}


                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="currentColor"
                  strokeWidth={2}
                  dot={{
                    r: 3,
                  }}
                  activeDot={{
                    r: 5,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}