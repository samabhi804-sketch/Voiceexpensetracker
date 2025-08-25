import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CategoryData {
  category: string;
  total: number;
}

interface CategoryChartProps {
  data: CategoryData[];
}

export default function CategoryChart({ data }: CategoryChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Chart.js integration
    import("chart.js/auto").then((Chart) => {
      // Clear any existing chart
      Chart.Chart.getChart(canvas)?.destroy();

      const colors = [
        "#3B82F6", // blue-500
        "#10B981", // emerald-500
        "#EF4444", // red-500
        "#8B5CF6", // violet-500
        "#F59E0B", // amber-500
        "#EC4899", // pink-500
        "#6366F1", // indigo-500
        "#84CC16", // lime-500
      ];

      new Chart.Chart(ctx, {
        type: "doughnut",
        data: {
          labels: data.map(item => item.category),
          datasets: [{
            data: data.map(item => item.total),
            backgroundColor: colors.slice(0, data.length),
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.parsed;
                  const total = data.reduce((sum, item) => sum + item.total, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: $${value.toFixed(2)} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    });
  }, [data]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle data-testid="text-category-chart-title">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <i className="fas fa-chart-pie text-4xl text-secondary mb-4"></i>
            <p className="text-secondary">No expense data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-category-chart-title">Spending by Category</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative h-64 mb-4">
          <canvas 
            ref={canvasRef} 
            data-testid="canvas-category-chart"
            className="w-full h-full"
          ></canvas>
        </div>
        
        {/* Legend */}
        <div className="space-y-2 text-sm">
          {data.slice(0, 3).map((item, index) => {
            const colors = ["#3B82F6", "#10B981", "#EF4444"];
            return (
              <div key={item.category} className="flex items-center justify-between" data-testid={`legend-item-${item.category.replace(/\s+/g, '-').toLowerCase()}`}>
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: colors[index] }}
                  ></div>
                  <span>{item.category}</span>
                </div>
                <span className="font-medium">${item.total.toFixed(2)}</span>
              </div>
            );
          })}
          {data.length > 3 && (
            <div className="text-center pt-2">
              <span className="text-secondary text-xs">
                +{data.length - 3} more categories
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
