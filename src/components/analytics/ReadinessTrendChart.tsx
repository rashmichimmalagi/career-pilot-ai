import React from 'react';
import { TrendingUp, Calendar, AlertCircle, Info } from 'lucide-react';
import { CareerReadinessTrendPoint } from '../../types/intelligence';

interface ReadinessTrendChartProps {
  trendPoints: CareerReadinessTrendPoint[];
  currentScore: number | null;
}

export const ReadinessTrendChart: React.FC<ReadinessTrendChartProps> = ({
  trendPoints,
  currentScore,
}) => {
  const safePoints = (trendPoints || []).filter(
    (p) => p && typeof p.score === 'number' && !isNaN(p.score)
  );

  const hasEnoughData = safePoints.length >= 2;

  // Compute overall min and max for chart bounds
  const minScore = 0;
  const maxScore = 100;

  // SVG Chart Geometry
  const width = 800;
  const height = 240;
  const paddingX = 50;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const pointsToRender = safePoints.map((pt, idx) => {
    const x =
      safePoints.length === 1
        ? paddingX + chartWidth / 2
        : paddingX + (idx / (safePoints.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (pt.score / maxScore) * chartHeight;
    return { ...pt, x, y };
  });

  const pathD = pointsToRender.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD =
    pointsToRender.length > 0
      ? `${pathD} L ${pointsToRender[pointsToRender.length - 1].x} ${
          paddingY + chartHeight
        } L ${pointsToRender[0].x} ${paddingY + chartHeight} Z`
      : '';

  // Score delta from first recorded to latest
  const firstScore = safePoints[0]?.score || 0;
  const latestScore = safePoints[safePoints.length - 1]?.score || 0;
  const totalDelta = safePoints.length >= 2 ? latestScore - firstScore : null;

  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Career Readiness Over Time
            </h3>
          </div>
          <p className="text-xs text-slate-500">
            Historical career readiness calculated from authentic practice snapshots and milestone dates.
          </p>
        </div>

        {totalDelta !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 self-start sm:self-auto">
            <span className="text-slate-500 font-normal">Historical Growth:</span>
            <span className={totalDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {totalDelta >= 0 ? `+${totalDelta}` : totalDelta} pts
            </span>
          </div>
        )}
      </div>

      {!hasEnoughData ? (
        <div className="py-12 px-6 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="max-w-sm space-y-1">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Complete more activities to see your progress trend
            </h4>
            <p className="text-xs text-slate-500">
              Your career readiness graph requires at least 2 activity sessions across coding, aptitude, interviews, or resume audits to plot authentic trajectory lines.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Responsive SVG Chart Container */}
          <div className="w-full overflow-x-auto">
            <div className="min-w-[600px] relative">
              <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="readinessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Grid Lines */}
                {[0, 25, 50, 75, 100].map((scoreVal) => {
                  const y = paddingY + chartHeight - (scoreVal / maxScore) * chartHeight;
                  return (
                    <g key={scoreVal}>
                      <line
                        x1={paddingX}
                        y1={y}
                        x2={width - paddingX}
                        y2={y}
                        stroke="currentColor"
                        className="text-slate-100 dark:text-slate-800/80 stroke-1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={paddingX - 12}
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] font-mono"
                      >
                        {scoreVal}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient Fill */}
                {areaD && <path d={areaD} fill="url(#readinessGrad)" />}

                {/* Line Path */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points and Labels */}
                {pointsToRender.map((pt, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="6"
                      fill="#6366f1"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="transition-transform group-hover:scale-125"
                    />

                    {/* Score Label Bubble */}
                    <rect
                      x={pt.x - 18}
                      y={pt.y - 28}
                      width="36"
                      height="20"
                      rx="6"
                      fill="#1e1b4b"
                      className="dark:fill-indigo-950 opacity-90"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 14}
                      textAnchor="middle"
                      fill="#ffffff"
                      className="text-[11px] font-bold font-mono"
                    >
                      {pt.score}
                    </text>

                    {/* Date label at bottom */}
                    <text
                      x={pt.x}
                      y={paddingY + chartHeight + 18}
                      textAnchor="middle"
                      className="fill-slate-500 text-[11px] font-medium"
                    >
                      {pt.displayDate}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* Timeline legend / summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {pointsToRender.slice(-4).map((pt, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{pt.displayDate}</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {pt.score}/100
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Code: {pt.codingScore || 0}</span>
                  <span>Apt: {pt.aptitudeScore || 0}</span>
                  <span>Int: {pt.interviewScore || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
