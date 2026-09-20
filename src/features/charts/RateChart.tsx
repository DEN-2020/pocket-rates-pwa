import { useEffect, useRef } from 'react';
import { ColorType, LineSeries, createChart, type LineData, type Time } from 'lightweight-charts';
import type { HistoricalPoint } from '../../domain/history/types';

interface RateChartProps {
  points: readonly HistoricalPoint[];
}

export default function RateChart({ points }: RateChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const styles = getComputedStyle(document.documentElement);
    const textColor = styles.getPropertyValue('--muted').trim() || '#929aa6';
    const lineColor = styles.getPropertyValue('--accent').trim() || '#8c84ff';
    const gridColor = styles.getPropertyValue('--line').trim() || 'rgba(255,255,255,.08)';

    const chart = createChart(container, {
      autoSize: true,
      height: 300,
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor }
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.12 }
      },
      timeScale: {
        borderVisible: false,
        rightOffset: 1,
        fixLeftEdge: true,
        fixRightEdge: true
      },
      crosshair: {
        vertLine: { color: textColor, labelBackgroundColor: lineColor },
        horzLine: { color: textColor, labelBackgroundColor: lineColor }
      }
    });

    const series = chart.addSeries(LineSeries, {
      color: lineColor,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true
    });

    const data: LineData<Time>[] = points.map((point) => ({
      time: point.date as Time,
      value: Number(point.value)
    }));

    series.setData(data);
    chart.timeScale().fitContent();

    return () => chart.remove();
  }, [points]);

  return <div className="rate-chart" ref={containerRef} aria-label="Historical exchange rate chart" />;
}
