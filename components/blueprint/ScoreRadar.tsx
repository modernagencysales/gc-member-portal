import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';
import { Prospect } from '../../types/blueprint-types';

// ============================================
// Types
// ============================================

interface ScoreRadarProps {
  prospect: Prospect;
}

interface ScoreDataItem {
  axis: string;
  score: number;
  fullMark: number;
}

// ============================================
// Score Labels
// ============================================

const SCORE_LABELS: Record<string, string> = {
  profileOptimization: 'Profile Optimization',
  contentPresence: 'Content Presence',
  outboundSystems: 'Outbound Systems',
  inboundInfrastructure: 'Inbound Infrastructure',
  socialProof: 'Social Proof',
};

// ============================================
// ScoreRadar Component
// ============================================

const ScoreRadar: React.FC<ScoreRadarProps> = ({ prospect }) => {
  // Extract scores from prospect data
  const radarData: ScoreDataItem[] = [
    {
      axis: 'Profile Optimization',
      score: prospect.scoreProfileOptimization ?? 0,
      fullMark: 10,
    },
    {
      axis: 'Content Presence',
      score: prospect.scoreContentPresence ?? 0,
      fullMark: 10,
    },
    {
      axis: 'Outbound Systems',
      score: prospect.scoreOutboundSystems ?? 0,
      fullMark: 10,
    },
    {
      axis: 'Inbound Infrastructure',
      score: prospect.scoreInboundInfrastructure ?? 0,
      fullMark: 10,
    },
    {
      axis: 'Social Proof',
      score: prospect.scoreSocialProof ?? 0,
      fullMark: 10,
    },
  ];

  // Individual score data for the list below the chart
  const scoreList = [
    { key: 'profileOptimization', score: prospect.scoreProfileOptimization ?? 0 },
    { key: 'contentPresence', score: prospect.scoreContentPresence ?? 0 },
    { key: 'outboundSystems', score: prospect.scoreOutboundSystems ?? 0 },
    { key: 'inboundInfrastructure', score: prospect.scoreInboundInfrastructure ?? 0 },
    { key: 'socialProof', score: prospect.scoreSocialProof ?? 0 },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
      {/* Section Title */}
      <h2 className="text-lg font-semibold text-zinc-100 mb-4">Authority Score Breakdown</h2>

      {/* Radar Chart */}
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            {/* Grid lines */}
            <PolarGrid stroke="#3f3f46" strokeOpacity={0.6} />

            {/* Axis labels */}
            <PolarAngleAxis
              dataKey="axis"
              tick={{
                fill: '#a1a1aa',
                fontSize: 11,
              }}
              tickLine={false}
            />

            {/* Radius axis (score scale) */}
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tick={{
                fill: '#71717a',
                fontSize: 10,
              }}
              tickCount={6}
              stroke="#3f3f46"
            />

            {/* Radar shape */}
            <Radar
              name="Score"
              dataKey="score"
              stroke="rgb(139, 92, 246)"
              fill="rgb(139, 92, 246)"
              fillOpacity={0.4}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Score List */}
      <div className="mt-6 pt-6 border-t border-zinc-800">
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider mb-4">
          Individual Scores
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {scoreList.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between bg-zinc-800/50 rounded-lg px-4 py-3"
            >
              <span className="text-sm text-zinc-300">{SCORE_LABELS[item.key]}</span>
              <span
                className={`text-lg font-bold ${
                  item.score >= 7
                    ? 'text-green-400'
                    : item.score >= 4
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {item.score}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScoreRadar;
