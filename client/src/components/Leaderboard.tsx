import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
}

interface LeaderboardProps {
  onViewFull: () => void;
}

// Random usernames for the leaderboard
const randomUsernames = [
  'CryptoKing', 'DiamondHands', 'MoonWalker', 'BullRun', 'HODLer',
  'PumpMaster', 'LamboDreams', 'ToTheMoon', 'DiamondEyes', 'CryptoNinja',
  'BlockChain', 'DeFiWizard', 'NFTCollector', 'YieldFarmer', 'StakeLord',
  'TokenHunter', 'SwapMaster', 'LiquidityKing', 'ProtocolBoss', 'ChainGuru',
  'Web3Warrior', 'MetaverseLord', 'GameFiPro', 'PlayToEarn', 'CryptoGamer',
  'PixelPump', 'RetroGamer', 'ArcadeKing', 'GameMaster', 'ScoreHunter',
  'LuckyPlayer', 'WinStreak', 'HighRoller', 'BigWinner', 'JackpotKing',
  'FortuneSeeker', 'LuckyDuck', 'WinnerTakesAll', 'CashOutKing', 'ProfitMaker'
];

// Generate random leaderboard data for top 3
const generateTopThree = (): LeaderboardEntry[] => {
  const shuffled = [...randomUsernames].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3);
  
  return selected.map((username, index) => ({
    rank: index + 1,
    username,
    score: Math.floor(Math.random() * 2000) + 500 // Random score between 500-2500
  })).sort((a, b) => b.score - a.score).map((entry, index) => ({
    ...entry,
    rank: index + 1
  }));
};

export default function Leaderboard({ onViewFull }: LeaderboardProps) {
  const [topThree, setTopThree] = useState<LeaderboardEntry[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Generate initial data
  useEffect(() => {
    setTopThree(generateTopThree());
  }, []);

  // Update leaderboard randomly every 4-10 seconds
  useEffect(() => {
    const updateInterval = setInterval(() => {
      setIsUpdating(true);
      
      // Simulate update delay
      setTimeout(() => {
        setTopThree(generateTopThree());
        setIsUpdating(false);
      }, 300);
    }, Math.random() * 6000 + 4000); // Random interval between 4-10 seconds

    return () => clearInterval(updateInterval);
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="bg-gray-800 p-3 border-2 border-gray-600 flex flex-col self-start">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-yellow-400 text-sm font-retro flex items-center">
          <Trophy className="w-4 h-4 mr-1" />
          Leaderboard
        </h3>
        {isUpdating && (
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </div>
      
      <div className="text-white text-xs space-y-1 font-retro mb-3">
        {topThree.map((entry) => (
          <div key={`${entry.username}-${entry.rank}`} className="flex justify-between items-center">
            <span className="truncate flex items-center gap-1">
              <span className={getRankColor(entry.rank)}>{getRankIcon(entry.rank)}</span>
              <span className="truncate max-w-[100px]">{entry.username}</span>
            </span>
            <span style={{color: '#53d493'}}>${entry.score.toLocaleString()}</span>
          </div>
        ))}
      </div>
      
      <button 
        onClick={onViewFull}
        className="bg-gray-700 text-white px-2 py-1 text-sm border-2 border-gray-600 hover:bg-gray-600 font-retro w-full transition-colors"
      >
        View Full Board
      </button>
    </div>
  );
}
