import { motion } from 'framer-motion';

export interface RecommendationCardProps {
  id: string;
  name: string;
  type: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  explanation: string;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isProcessing?: boolean;
}

export default function RecommendationCard({
  id,
  name,
  type,
  score,
  confidence,
  explanation,
  onAccept,
  onDecline,
  isProcessing = false
}: RecommendationCardProps) {
  
  // Calculate percentage for the score badge
  const scorePercentage = Math.round(score * 100);
  
  // Determine badge colors based on confidence
  let badgeColor = '';
  if (confidence === 'high') {
    badgeColor = 'bg-green-100 text-green-800 border-green-200';
  } else if (confidence === 'medium') {
    badgeColor = 'bg-amber-100 text-amber-800 border-amber-200';
  } else {
    badgeColor = 'bg-red-100 text-red-800 border-red-200';
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
      data-testid="recommendation-card"
    >
      <div className="p-5 flex items-start gap-4">
        {/* Avatar Placeholder */}
        <div className="flex-shrink-0">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg">
            {name.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 truncate">{name}</h3>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeColor}`}>
              {scorePercentage}% Match
            </span>
          </div>
          
          <p className="text-sm font-medium text-gray-500 capitalize mb-2">{type}</p>
          
          <div className="bg-gray-50 rounded-md p-3 border border-gray-100 mt-2">
            <div className="flex gap-2">
              <span className="text-blue-500">✨</span>
              <p className="text-sm text-gray-700 leading-relaxed">
                {explanation}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end gap-3">
        <button
          onClick={() => onDecline(id)}
          disabled={isProcessing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          Decline
        </button>
        <button
          onClick={() => onAccept(id)}
          disabled={isProcessing}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
        >
          Accept Match
        </button>
      </div>
    </motion.div>
  );
}
