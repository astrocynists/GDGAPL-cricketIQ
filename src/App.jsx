import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Users, 
  TrendingUp, 
  Zap, 
  Award, 
  Sparkles, 
  MapPin, 
  Activity, 
  Info, 
  Shield, 
  Target, 
  Flame, 
  Trophy, 
  Sliders, 
  Plus, 
  Trash2, 
  HelpCircle, 
  CheckCircle,
  HelpCircle as QuestionIcon,
  ChevronRight,
  TrendingDown,
  Percent
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  AreaChart, 
  Area,
  ReferenceLine
} from 'recharts';

import { playersData, teamDNA, venueInsights, matchSimulation, fantasyData } from './data/mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState('match-center');
  
  // Simulator State
  const [currentBallIndex, setCurrentBallIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2000); // ms per ball
  const simulationInterval = useRef(null);

  // Comparison State
  const [selectedPlayer1Id, setSelectedPlayer1Id] = useState('virat-kohli');
  const [selectedPlayer2Id, setSelectedPlayer2Id] = useState('shubman-gill');

  // Fantasy State
  const [fantasyBudget, setFantasyBudget] = useState(100);
  const [selectedFantasyPlayers, setSelectedFantasyPlayers] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);

  // Auto-scroll commentary container
  const commentaryEndRef = useRef(null);

  const activePlayer1 = useMemo(() => playersData.find(p => p.id === selectedPlayer1Id), [selectedPlayer1Id]);
  const activePlayer2 = useMemo(() => playersData.find(p => p.id === selectedPlayer2Id), [selectedPlayer2Id]);

  // Handle Match Simulation Tick
  useEffect(() => {
    if (isPlaying) {
      simulationInterval.current = setInterval(() => {
        setCurrentBallIndex(prev => {
          if (prev >= matchSimulation.balls.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else {
      clearInterval(simulationInterval.current);
    }

    return () => clearInterval(simulationInterval.current);
  }, [isPlaying, playbackSpeed]);

  // Scroll to top of commentary when index changes
  useEffect(() => {
    if (commentaryEndRef.current) {
      commentaryEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentBallIndex]);

  const currentBallData = matchSimulation.balls[currentBallIndex];

  // Live simulation timeline data for the graph
  const liveProbabilityData = useMemo(() => {
    return matchSimulation.balls.slice(0, currentBallIndex + 1).map((b, idx) => ({
      ballLabel: `${b.over}.${b.ball}`,
      ballNumber: idx + 1,
      rcbProb: b.winProbabilityRCB,
      gtProb: b.winProbabilityGT,
      score: b.score,
      event: b.isWicket ? 'WICKET' : b.isSix ? 'SIX' : b.isBoundary ? 'FOUR' : ''
    }));
  }, [currentBallIndex]);

  // Full timeline data for reference/background guides
  const fullProbabilityData = useMemo(() => {
    return matchSimulation.balls.map((b, idx) => ({
      ballLabel: `${b.over}.${b.ball}`,
      ballNumber: idx + 1,
      rcbProb: b.winProbabilityRCB,
      gtProb: b.winProbabilityGT,
    }));
  }, []);

  // Handle Fantasy Selection
  const toggleFantasyPlayer = (player) => {
    if (selectedFantasyPlayers.some(p => p.name === player.name)) {
      setSelectedFantasyPlayers(prev => prev.filter(p => p.name !== player.name));
      // Reset Captain/VC if removed
      if (captainId === player.name) setCaptainId(null);
      if (viceCaptainId === player.name) setViceCaptainId(null);
    } else {
      if (selectedFantasyPlayers.length >= 11) {
        return; // Max 11 players
      }
      setSelectedFantasyPlayers(prev => [...prev, player]);
    }
  };

  const clearFantasySquad = () => {
    setSelectedFantasyPlayers([]);
    setCaptainId(null);
    setViceCaptainId(null);
  };

  // Auto-fill a recommended team within budget
  const autoFillSquad = () => {
    // Select a balanced squad automatically
    const squad = [];
    
    // Sort players by rating descending
    const sorted = [...fantasyData.players].sort((a, b) => b.rating - a.rating);
    
    // 1 WK, 4 Batter, 2 AR, 4 Bowl
    const wks = sorted.filter(p => p.role === 'WK');
    const bats = sorted.filter(p => p.role === 'BAT');
    const ars = sorted.filter(p => p.role === 'AR');
    const bowls = sorted.filter(p => p.role === 'BOWL');

    let totalCredits = 0;

    const addPlayer = (p) => {
      if (squad.length < 11 && (totalCredits + p.credits) <= fantasyBudget) {
        squad.push(p);
        totalCredits += p.credits;
        return true;
      }
      return false;
    };

    // Add core requirements
    if (wks[0]) addPlayer(wks[0]);
    bats.slice(0, 3).forEach(addPlayer);
    ars.slice(0, 2).forEach(addPlayer);
    bowls.slice(0, 3).forEach(addPlayer);

    // Fill remaining spots
    for (const p of sorted) {
      if (!squad.some(s => s.name === p.name)) {
        addPlayer(p);
      }
    }

    setSelectedFantasyPlayers(squad);
    // Set captain to highest rated (Virat Kohli)
    const cap = squad.find(p => p.name === 'Virat Kohli') || squad[0];
    const vc = squad.find(p => p.name === 'Rashid Khan') || squad[1];
    if (cap) setCaptainId(cap.name);
    if (vc) setViceCaptainId(vc.name);
  };

  // Calculate Fantasy Team Stats
  const fantasyStats = useMemo(() => {
    const count = selectedFantasyPlayers.length;
    const creditsUsed = selectedFantasyPlayers.reduce((sum, p) => sum + p.credits, 0);
    const rcbCount = selectedFantasyPlayers.filter(p => p.team === 'RCB').length;
    const gtCount = selectedFantasyPlayers.filter(p => p.team === 'GT').length;

    // Roles count
    const wks = selectedFantasyPlayers.filter(p => p.role === 'WK').length;
    const bats = selectedFantasyPlayers.filter(p => p.role === 'BAT').length;
    const ars = selectedFantasyPlayers.filter(p => p.role === 'AR').length;
    const bowls = selectedFantasyPlayers.filter(p => p.role === 'BOWL').length;

    // AI Rating calculations
    let rating = 0;
    let feedback = '';
    let status = 'info'; // info, warning, error, success

    if (count < 11) {
      status = 'info';
      feedback = `Assemble your 11-player squad. Select ${11 - count} more players. Make sure to assign a Captain (2x points) and Vice-Captain (1.5x points).`;
      rating = Math.round((creditsUsed / (count || 1)) * 8);
    } else if (creditsUsed > fantasyBudget) {
      status = 'error';
      feedback = `🚨 Budget Exceeded! You have spent ${creditsUsed.toFixed(1)} / ${fantasyBudget} credits. Please replace some expensive players with lower-credit differential picks.`;
      rating = 3.5;
    } else if (wks < 1 || bats < 3 || ars < 1 || bowls < 3) {
      status = 'warning';
      feedback = `⚠️ Invalid Team Combination! Ensure you have at least: 1 Wicketkeeper (WK), 3 Batters (BAT), 1 All-Rounder (AR), and 3 Bowlers (BOWL). Current: WK: ${wks}, BAT: ${bats}, AR: ${ars}, BOWL: ${bowls}`;
      rating = 5.2;
    } else if (!captainId || !viceCaptainId) {
      status = 'warning';
      feedback = `⚠️ Captain or Vice-Captain not selected! Click the 'C' and 'VC' buttons in your squad builder below to set multipliers.`;
      rating = 6.8;
    } else {
      status = 'success';
      // Calculate a rating score based on average ratings
      const totalPlayerRating = selectedFantasyPlayers.reduce((sum, p) => {
        let weight = 1;
        if (p.name === captainId) weight = 2;
        if (p.name === viceCaptainId) weight = 1.5;
        return sum + (p.rating * weight);
      }, 0);
      
      const normalizedRating = totalPlayerRating / 14.5; // max score indicator
      const finalRating = Math.min(10.0, Number((normalizedRating * 1.05).toFixed(1)));
      
      let tips = '';
      if (captainId === 'Virat Kohli') {
        tips += ' Great choice assigning Kohli as Captain; his chasing statistics are record-breaking.';
      } else {
        tips += ' Tip: Kohli has 9.9 form rating tonight. Making him Captain could optimize your yield.';
      }
      
      if (selectedFantasyPlayers.some(p => p.isDifferential)) {
        tips += ' Excellent addition of low-ownership differential picks to boost rank.';
      } else {
        tips += ' Tip: Consider adding a differential like Karn Sharma (25% ownership) to gain an edge.';
      }

      feedback = `🎉 Squad Approved! Your team has exceptional balance and high form ratings. AI Rating: ${finalRating}/10. ${tips}`;
      rating = finalRating;
    }

    return {
      count,
      creditsUsed,
      rcbCount,
      gtCount,
      roles: { WK: wks, BAT: bats, AR: ars, BOWL: bowls },
      feedback,
      rating,
      status
    };
  }, [selectedFantasyPlayers, captainId, viceCaptainId, fantasyBudget]);

  // Formatted player comparison stats for Recharts
  const comparisonChartData = useMemo(() => {
    if (!activePlayer1 || !activePlayer2) return [];
    return [
      { metric: 'Avg Form', [activePlayer1.name]: activePlayer1.stats.recentFormRating * 10, [activePlayer2.name]: activePlayer2.stats.recentFormRating * 10 },
      { metric: 'Bat Avg', [activePlayer1.name]: activePlayer1.stats.average, [activePlayer2.name]: activePlayer2.stats.average },
      { metric: 'S/R', [activePlayer1.name]: activePlayer1.stats.strikeRate / 1.7, [activePlayer2.name]: activePlayer2.stats.strikeRate / 1.7 }, // scale down for visual comparison
      { metric: 'Pressure', [activePlayer1.name]: activePlayer1.stats.pressureRating * 10, [activePlayer2.name]: activePlayer2.stats.pressureRating * 10 },
      { metric: 'Chase Avg', [activePlayer1.name]: activePlayer1.stats.chaseAverage, [activePlayer2.name]: activePlayer2.stats.chaseAverage },
      { metric: 'Boundary %', [activePlayer1.name]: activePlayer1.stats.boundaryPercentage * 3, [activePlayer2.name]: activePlayer2.stats.boundaryPercentage * 3 }, // scaled up
    ];
  }, [activePlayer1, activePlayer2]);

  // Combined DNA chart data for radar comparison
  const teamDnaChartData = useMemo(() => {
    return teamDNA.RCB.dna.map((aspectObj, idx) => {
      const gtAspect = teamDNA.GT.dna[idx];
      return {
        aspect: aspectObj.aspect,
        RCB: aspectObj.score,
        GT: gtAspect.score
      };
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#050811] text-gray-100 flex flex-col font-sans selection:bg-red-500 selection:text-white pb-10">
      
      {/* Top Banner / Hero header */}
      <header className="glass-panel sticky top-0 z-50 border-b border-white/5 py-4 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-rcb-red to-rcb-gold rounded-xl shadow-lg shadow-rcb-red/20 animate-pulse-slow">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-white flex items-center gap-2 m-0">
              Cricket<span className="text-rcb-gold">IQ</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">AI-Powered</span>
            </h1>
            <p className="text-[10px] text-gray-400 tracking-wider uppercase font-medium">Sports Analytics & Intelligence Engine</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('match-center')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'match-center' ? 'bg-gradient-to-r from-rcb-red to-rcb-red-light text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Activity className="w-4 h-4" />
            Live Match Center
          </button>
          <button 
            onClick={() => setActiveTab('comparison')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'comparison' ? 'bg-gradient-to-r from-rcb-red to-rcb-red-light text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Users className="w-4 h-4" />
            Comparison Studio
          </button>
          <button 
            onClick={() => setActiveTab('fantasy')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'fantasy' ? 'bg-gradient-to-r from-rcb-red to-rcb-red-light text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Sparkles className="w-4 h-4" />
            AI Fantasy Assistant
          </button>
          <button 
            onClick={() => setActiveTab('trends')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'trends' ? 'bg-gradient-to-r from-rcb-red to-rcb-red-light text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <TrendingUp className="w-4 h-4" />
            Trends & Venue
          </button>
          <button 
            onClick={() => setActiveTab('dna')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === 'dna' ? 'bg-gradient-to-r from-rcb-red to-rcb-red-light text-white shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Shield className="w-4 h-4" />
            Team DNA
          </button>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 mt-6">
        
        {/* TAB 1: Live Match Center */}
        {activeTab === 'match-center' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Simulation Banner Info */}
            <div className="glass-card p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-80 h-80 bg-rcb-red/5 rounded-full filter blur-[60px] -z-10 pointer-events-none"></div>
              <div className="absolute left-0 bottom-0 w-80 h-80 bg-blue-500/5 rounded-full filter blur-[60px] -z-10 pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="text-center bg-black/30 py-2 px-4 rounded-xl border border-white/5">
                  <span className="text-2xl font-black text-red-500">FINAL</span>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold font-display">T20 League</p>
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-white mb-0.5">{matchSimulation.info.title}</h2>
                  <p className="text-xs text-gray-400 flex items-center gap-1 justify-center md:justify-start">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" /> {matchSimulation.info.venue} | {matchSimulation.info.date}
                  </p>
                </div>
              </div>

              {/* Match Playback Controls Widget */}
              <div className="flex flex-col items-center md:items-end gap-2 bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Simulation:</span>
                  <button 
                    onClick={() => {
                      if (currentBallIndex >= matchSimulation.balls.length - 1) {
                        setCurrentBallIndex(0);
                      }
                      setIsPlaying(!isPlaying);
                    }}
                    className={`p-2 rounded-lg transition-all ${isPlaying ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                    title={isPlaying ? "Pause Simulation" : "Start Live Simulation"}
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  </button>
                  <button 
                    onClick={() => {
                      setCurrentBallIndex(prev => Math.min(matchSimulation.balls.length - 1, prev + 1));
                    }}
                    disabled={currentBallIndex >= matchSimulation.balls.length - 1}
                    className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-50"
                    title="Next Ball"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentBallIndex(0);
                    }}
                    className="p-2 rounded-lg bg-white/5 text-gray-300 hover:bg-white/10"
                    title="Restart Simulation"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                
                {/* Speed Multiplier */}
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-400">Speed:</span>
                  {[
                    { label: '1x', val: 2500 },
                    { label: '2x', val: 1200 },
                    { label: '5x', val: 400 }
                  ].map(s => (
                    <button
                      key={s.label}
                      onClick={() => setPlaybackSpeed(s.val)}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${playbackSpeed === s.val ? 'bg-rcb-gold border-rcb-gold text-black' : 'border-white/10 text-gray-400 hover:text-white'}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Scorecard and Win Predictor Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Scorecard Widget */}
              <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
                {/* Embedded Glow corresponding to which team dominates */}
                <div className={`absolute top-0 right-0 w-64 h-64 rounded-full filter blur-[80px] -z-10 pointer-events-none transition-all duration-1000 ${currentBallData.winProbabilityRCB > 60 ? 'bg-rcb-red/10' : 'bg-gt-navy/40'}`}></div>
                
                <div className="flex flex-col gap-6">
                  {/* Scores and Overs */}
                  <div className="flex justify-between items-start border-b border-white/5 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Live Final Chase</span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-extrabold font-display text-white tracking-tight">{currentBallData.score}</span>
                        <span className="text-sm font-semibold text-gray-400">RCB</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Target: <strong className="text-white font-bold">{matchSimulation.info.target} Runs</strong> | GT First Innings: <span className="text-gray-300">{matchSimulation.info.gtScore}</span>
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Overs Completed</span>
                      <div className="text-2xl font-black font-display text-white mt-0.5">
                        {currentBallData.over}.{currentBallData.ball} <span className="text-xs text-gray-400 font-semibold">/ 20.0</span>
                      </div>
                      <span className="text-xs bg-white/5 border border-white/10 px-2 py-0.5 rounded-md font-semibold text-gray-300 mt-1.5 inline-block">
                        CRR: {currentBallData.currentRunRate}
                      </span>
                    </div>
                  </div>

                  {/* Batsmen & Bowlers details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                    <div>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Batting</span>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className={`font-semibold flex items-center gap-1.5 ${currentBallData.striker === 'Virat Kohli' ? 'text-rcb-gold font-bold' : 'text-white'}`}>
                            {currentBallData.striker} *
                            {currentBallData.striker === 'Virat Kohli' && <Award className="w-3.5 h-3.5 text-rcb-gold fill-current" />}
                          </span>
                          <span className="font-mono text-gray-300 font-bold">
                            {currentBallData.striker === 'Virat Kohli' ? (currentBallIndex >= 27 ? '121* (58)' : currentBallIndex >= 15 ? '72* (38)' : '58* (28)') : (currentBallData.striker === 'Dinesh Karthik' ? '22 (14)' : '2* (2)')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-400">
                          <span className={`${currentBallData.nonStriker === 'Virat Kohli' ? 'text-rcb-gold font-bold' : 'text-gray-400'}`}>
                            {currentBallData.nonStriker}
                          </span>
                          <span className="font-mono text-gray-400">
                            {currentBallData.nonStriker === 'Virat Kohli' ? '121* (58)' : (currentBallData.nonStriker === 'Dinesh Karthik' ? '20 (12)' : '1* (1)')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t md:border-t-0 md:border-l border-white/5 pt-3 md:pt-0 md:pl-4">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Bowler</span>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-white">{currentBallData.bowler}</span>
                        <span className="font-mono text-gray-400">
                          {currentBallData.bowler === 'Mohit Sharma' ? '3.5-0-38-2' : (currentBallData.bowler === 'Mohammed Shami' ? '4-0-42-2' : '4-0-24-1')}
                        </span>
                      </div>
                      <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1.5">
                        <span className="inline-block px-1.5 py-0.5 rounded bg-black/40 text-blue-400 font-mono">Ball Matchup</span>
                        {currentBallData.striker === 'Virat Kohli' && currentBallData.bowler === 'Mohit Sharma' 
                          ? 'Kohli strike rate vs Mohit: 174.5' 
                          : 'Rashid Khan restricts Kohli to 122 SR'}
                      </div>
                    </div>
                  </div>

                  {/* Calculations / Runs needed */}
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gradient-to-r from-rcb-red/10 to-transparent p-4 rounded-xl border-l-4 border-rcb-red">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {currentBallData.runsNeeded === 0 ? (
                          <span className="text-green-400 font-extrabold text-lg flex items-center gap-1.5">
                            <Trophy className="w-5 h-5 text-rcb-gold fill-current" /> RCB WINS THE CHAMPIONSHIP!
                          </span>
                        ) : (
                          <>
                            RCB needs <strong className="text-rcb-gold text-lg">{currentBallData.runsNeeded} Runs</strong> in <strong className="text-white text-lg">{currentBallData.ballsRemaining} Balls</strong>
                          </>
                        )}
                      </p>
                      {currentBallData.runsNeeded > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Final Match target score was 209 runs set by GT</p>
                      )}
                    </div>

                    {currentBallData.runsNeeded > 0 && (
                      <div className="text-center md:text-right">
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block">Required Run Rate</span>
                        <span className="text-lg font-black text-white">{currentBallData.requiredRunRate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulation Scrubber Slide Slider */}
                <div className="mt-6 pt-4 border-t border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-gray-400">
                    <span>Over 14.0 (125/4)</span>
                    <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded">Scrub Match Progress</span>
                    <span>Over 20.0 (209/6 - Final Ball)</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max={matchSimulation.balls.length - 1} 
                    value={currentBallIndex} 
                    onChange={(e) => {
                      setIsPlaying(false);
                      setCurrentBallIndex(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-rcb-red transition-all"
                  />
                  <div className="flex justify-between items-center text-[9px] text-gray-500 font-mono pt-1">
                    <span>Ball 0 (Start of 15th over)</span>
                    <span className="text-rcb-gold font-semibold">Current ball index: {currentBallIndex + 1} / 36</span>
                    <span>Ball 35 (Last ball of 20th over)</span>
                  </div>
                </div>
              </div>

              {/* Win Predictor Gauge Widget */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none"></div>
                <div>
                  <h3 className="text-sm font-bold font-display uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400 fill-current" /> Live Win Predictor
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">XGBoost real-time match predictions</p>
                </div>

                {/* Probability Gauge UI */}
                <div className="my-6 flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    
                    {/* Semi-circular radial gauge style using simple CSS and SVG */}
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Base Track */}
                      <circle 
                        cx="80" 
                        cy="80" 
                        r="64" 
                        className="stroke-gray-800 fill-none" 
                        strokeWidth="12"
                      />
                      {/* GT Indicator Line (bottom layer) */}
                      <circle 
                        cx="80" 
                        cy="80" 
                        r="64" 
                        className="stroke-blue-600 fill-none" 
                        strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 64}
                        strokeDashoffset={2 * Math.PI * 64 * 0} // Full circle
                      />
                      {/* RCB Indicator Line (active foreground) */}
                      <circle 
                        cx="80" 
                        cy="80" 
                        r="64" 
                        className="stroke-rcb-red fill-none transition-all duration-500" 
                        strokeWidth="12"
                        strokeDasharray={2 * Math.PI * 64}
                        strokeDashoffset={2 * Math.PI * 64 * (1 - currentBallData.winProbabilityRCB / 100)}
                      />
                    </svg>
                    
                    {/* Center Numbers */}
                    <div className="absolute text-center">
                      <span className="text-3xl font-black font-display text-white">{currentBallData.winProbabilityRCB}%</span>
                      <p className="text-[9px] font-bold text-rcb-gold uppercase tracking-wider mt-0.5">RCB Win Prob</p>
                    </div>
                  </div>

                  {/* Dual Bar Comparison */}
                  <div className="w-full space-y-2 mt-4">
                    <div className="flex justify-between text-xs font-bold font-mono">
                      <span className="text-rcb-red-light">RCB: {currentBallData.winProbabilityRCB}%</span>
                      <span className="text-blue-400">GT: {currentBallData.winProbabilityGT}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden flex border border-white/5">
                      <div 
                        className="h-full bg-gradient-to-r from-rcb-red-dark to-rcb-red transition-all duration-500" 
                        style={{ width: `${currentBallData.winProbabilityRCB}%` }}
                      ></div>
                      <div 
                        className="h-full bg-gradient-to-r from-blue-700 to-gt-navy transition-all duration-500" 
                        style={{ width: `${currentBallData.winProbabilityGT}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* AI Predictive Insight */}
                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rcb-gold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Predictive Engine:
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed">
                    {currentBallData.runsNeeded === 0 
                      ? "RCB has officially won the championship. Win Probability reaches 100%."
                      : currentBallData.winProbabilityRCB < 15 
                        ? `GT holds control. Over-by-over analysis shows RCB must score boundaries off ${currentBallData.bowler} to trigger a win scenario.` 
                        : currentBallData.winProbabilityRCB > 70 
                          ? `Kohli's anchoring rating is high. Model calculates RCB is heavily favored to close this chase.`
                          : `High tension. Dew index is at 84%, making GT spin grip unstable. Model suggests batting advantage.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Momentum Engine Graphic and Live commentary Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Momentum Graphic */}
              <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-bold font-display uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-rcb-red" /> Match Momentum Engine
                    </h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Win probability path throughout the final overs</p>
                  </div>
                  
                  {/* Legend Indicators */}
                  <div className="flex items-center gap-3 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-rcb-red inline-block"></span>
                      <span className="text-gray-300 font-medium">RCB</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 bg-blue-500 inline-block"></span>
                      <span className="text-gray-300 font-medium">GT</span>
                    </div>
                  </div>
                </div>

                {/* Graph Container */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={liveProbabilityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis 
                        dataKey="ballLabel" 
                        stroke="#4B5563" 
                        fontSize={9} 
                        tickLine={false} 
                      />
                      <YAxis 
                        stroke="#4B5563" 
                        fontSize={9} 
                        domain={[0, 100]} 
                        tickLine={false} 
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="p-3 bg-[#0d1423] border border-white/10 rounded-lg shadow-xl text-xs space-y-1">
                                <p className="font-bold text-white font-display">Over {data.ballLabel}</p>
                                <p className="text-gray-400">Score: <strong className="text-white font-bold">{data.score}</strong></p>
                                <p className="text-rcb-red-light">RCB Prob: <span className="font-bold">{data.rcbProb}%</span></p>
                                <p className="text-blue-400">GT Prob: <span className="font-bold">{data.gtProb}%</span></p>
                                {data.event && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-400 text-[9px] font-bold rounded">
                                    {data.event}
                                  </span>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="rcbProb" 
                        stroke="#C91D2E" 
                        strokeWidth={3} 
                        dot={false}
                        activeDot={{ r: 5, strokeWidth: 0, fill: '#E3B53C' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="gtProb" 
                        stroke="#3B82F6" 
                        strokeWidth={1.5} 
                        strokeDasharray="4 4"
                        dot={false} 
                      />
                      
                      {/* Critical events reference line markers */}
                      {liveProbabilityData.map((d, i) => {
                        if (d.event === 'WICKET') {
                          return (
                            <ReferenceLine
                              key={`wicket-${i}`}
                              x={d.ballLabel}
                              stroke="#EF4444"
                              strokeWidth={1}
                              strokeDasharray="3 3"
                            />
                          );
                        }
                        return null;
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex justify-between items-center text-[9.5px] text-gray-400 border-t border-white/5 pt-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    <span>Red dashed lines indicate Wickets</span>
                  </div>
                  <span className="text-[10px] text-gray-500">Note: Match starts with GT dominating (85%) and transitions into a sharp RCB spike.</span>
                </div>
              </div>

              {/* AI Live Commentary Widget */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div className="border-b border-white/5 pb-4 mb-3">
                  <h3 className="text-sm font-bold font-display uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-rcb-gold" /> AI Commentary
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-sans">Natural language event generation</p>
                </div>

                {/* Commentary List Container */}
                <div className="flex-1 overflow-y-auto max-h-60 pr-1 space-y-3.5 scrollbar-thin scroll-smooth flex flex-col-reverse">
                  <div ref={commentaryEndRef} />
                  
                  {matchSimulation.balls.slice(0, currentBallIndex + 1).reverse().map((b, idx) => {
                    const isLast = idx === 0;
                    return (
                      <div 
                        key={idx} 
                        className={`p-3 rounded-xl border text-xs transition-all ${
                          isLast 
                            ? 'bg-gradient-to-r from-white/5 to-transparent border-white/10 shadow-lg' 
                            : 'bg-black/10 border-transparent text-gray-400'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className={`font-mono text-[10px] font-bold ${
                            b.isWicket 
                              ? 'text-red-500' 
                              : b.isSix || b.isBoundary 
                                ? 'text-rcb-gold' 
                                : 'text-gray-400'
                          }`}>
                            Over {b.over}.{b.ball} - {b.striker} to {b.bowler}
                          </span>
                          
                          {/* Event Tags */}
                          {b.isWicket && (
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-500 text-[8px] font-bold uppercase tracking-wider border border-red-500/30">
                              Wicket ({b.wicketType})
                            </span>
                          )}
                          {b.isSix && (
                            <span className="px-1.5 py-0.5 rounded bg-yellow-500/20 text-rcb-gold text-[8px] font-bold uppercase tracking-wider border border-yellow-500/30 animate-bounce">
                              SIX! 💥
                            </span>
                          )}
                          {!b.isSix && b.isBoundary && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[8px] font-bold uppercase tracking-wider border border-amber-500/20">
                              FOUR! 🏏
                            </span>
                          )}
                          {!b.isWicket && !b.isBoundary && b.runs === 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-[8px] font-medium border border-white/5">
                              DOT
                            </span>
                          )}
                          {!b.isWicket && !b.isBoundary && b.runs > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-white/5 text-gray-300 text-[8px] font-medium border border-white/5 font-mono">
                              {b.runs} Run{b.runs > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>

                        <p className={`leading-relaxed text-[11px] ${isLast ? 'text-white' : 'text-gray-300'}`}>
                          {b.commentary}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Player Comparison Studio */}
        {activeTab === 'comparison' && (
          <div className="space-y-6 animate-fade-in">
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <h2 className="text-xl font-bold font-display text-white mb-2">Player Comparison Studio</h2>
              <p className="text-xs text-gray-400">Select any two players to compare key statistics, boundary ratios, and pressure indices.</p>

              {/* Selector Bar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                
                {/* Player 1 Selector */}
                <div className="flex flex-col gap-1.5 bg-black/20 p-4 rounded-xl border border-white/5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Player A</label>
                  <select 
                    value={selectedPlayer1Id}
                    onChange={(e) => setSelectedPlayer1Id(e.target.value)}
                    className="w-full bg-[#080d19] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rcb-red"
                  >
                    {playersData.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.team} - {p.role})</option>
                    ))}
                  </select>
                </div>

                {/* Player 2 Selector */}
                <div className="flex flex-col gap-1.5 bg-black/20 p-4 rounded-xl border border-white/5">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Select Player B</label>
                  <select 
                    value={selectedPlayer2Id}
                    onChange={(e) => setSelectedPlayer2Id(e.target.value)}
                    className="w-full bg-[#080d19] border border-white/10 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rcb-red"
                  >
                    {playersData.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.team} - {p.role})</option>
                    ))}
                  </select>
                </div>

              </div>
            </div>

            {/* Smart Player Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Player 1 Card */}
              {activePlayer1 && (
                <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-48 h-48 rounded-full filter blur-[60px] -z-10 pointer-events-none opacity-30 ${activePlayer1.team === 'RCB' ? 'bg-rcb-red' : 'bg-blue-600'}`}></div>
                  
                  <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">
                    <div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${activePlayer1.team === 'RCB' ? 'bg-rcb-red/20 text-red-400 border border-rcb-red/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                        {activePlayer1.team} • {activePlayer1.role}
                      </span>
                      <h3 className="text-xl font-bold font-display text-white mt-2">{activePlayer1.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Rating</span>
                      <span className="text-2xl font-black text-rcb-gold">{activePlayer1.profile.rating}/10</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed italic bg-black/25 p-3 rounded-lg border border-white/5 mb-4">
                    "{activePlayer1.profile.description}"
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Strengths</span>
                      <ul className="list-inside list-disc mt-1 text-gray-300 space-y-1">
                        {activePlayer1.profile.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Weaknesses</span>
                      <ul className="list-inside list-disc mt-1 text-gray-300 space-y-1">
                        {activePlayer1.profile.weaknesses.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Player 2 Card */}
              {activePlayer2 && (
                <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-48 h-48 rounded-full filter blur-[60px] -z-10 pointer-events-none opacity-30 ${activePlayer2.team === 'RCB' ? 'bg-rcb-red' : 'bg-blue-600'}`}></div>
                  
                  <div className="flex justify-between items-start border-b border-white/5 pb-4 mb-4">
                    <div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${activePlayer2.team === 'RCB' ? 'bg-rcb-red/20 text-red-400 border border-rcb-red/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                        {activePlayer2.team} • {activePlayer2.role}
                      </span>
                      <h3 className="text-xl font-bold font-display text-white mt-2">{activePlayer2.name}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 uppercase font-bold block">Rating</span>
                      <span className="text-2xl font-black text-rcb-gold">{activePlayer2.profile.rating}/10</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed italic bg-black/25 p-3 rounded-lg border border-white/5 mb-4">
                    "{activePlayer2.profile.description}"
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Strengths</span>
                      <ul className="list-inside list-disc mt-1 text-gray-300 space-y-1">
                        {activePlayer2.profile.strengths.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Weaknesses</span>
                      <ul className="list-inside list-disc mt-1 text-gray-300 space-y-1">
                        {activePlayer2.profile.weaknesses.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Radar Comparison Chart and Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Chart container */}
              <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-gray-400 mb-4 border-b border-white/5 pb-2">
                  Performance Dimensions Comparison
                </h3>
                
                <div className="h-72 w-full flex items-center justify-center">
                  {activePlayer1 && activePlayer2 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonChartData}>
                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                        <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4B5563" fontSize={8} />
                        <Radar 
                          name={activePlayer1.name} 
                          dataKey={activePlayer1.name} 
                          stroke={activePlayer1.team === 'RCB' ? '#C91D2E' : '#3B82F6'} 
                          fill={activePlayer1.team === 'RCB' ? '#C91D2E' : '#3B82F6'} 
                          fillOpacity={0.25} 
                        />
                        <Radar 
                          name={activePlayer2.name} 
                          dataKey={activePlayer2.name} 
                          stroke={activePlayer2.team === 'RCB' ? '#C91D2E' : '#3B82F6'} 
                          fill={activePlayer2.team === 'RCB' ? '#C91D2E' : '#3B82F6'} 
                          fillOpacity={0.25} 
                        />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Hard Numbers Table */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider text-gray-400 mb-4 border-b border-white/5 pb-2">
                    Comparative Metrics
                  </h3>

                  {activePlayer1 && activePlayer2 && (
                    <div className="space-y-4">
                      {[
                        { label: 'Batting Average', key: 'average', unit: '' },
                        { label: 'Strike Rate', key: 'strikeRate', unit: '' },
                        { label: 'Boundary %', key: 'boundaryPercentage', unit: '%' },
                        { label: 'Pressure Index', key: 'pressureRating', unit: '/10' },
                        { label: 'Chase Avg', key: 'chaseAverage', unit: '' }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between text-gray-400 font-medium">
                            <span>{item.label}</span>
                            <span className="text-[10px] font-bold text-gray-500">
                              Diff: {Math.abs(activePlayer1.stats[item.key] - activePlayer2.stats[item.key]).toFixed(1)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 items-center">
                            {/* Player A Progress bar */}
                            <div className="flex items-center gap-2">
                              <span className="w-12 text-right font-mono font-bold text-white text-[10px]">
                                {activePlayer1.stats[item.key]}{item.unit}
                              </span>
                              <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${activePlayer1.team === 'RCB' ? 'bg-rcb-red' : 'bg-blue-500'}`} 
                                  style={{ width: `${Math.min(100, item.key === 'strikeRate' ? activePlayer1.stats[item.key] / 2 : activePlayer1.stats[item.key] * (item.key === 'pressureRating' ? 10 : 1.5))}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Player B Progress bar */}
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-900 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${activePlayer2.team === 'RCB' ? 'bg-rcb-red' : 'bg-blue-500'}`} 
                                  style={{ width: `${Math.min(100, item.key === 'strikeRate' ? activePlayer2.stats[item.key] / 2 : activePlayer2.stats[item.key] * (item.key === 'pressureRating' ? 10 : 1.5))}%` }}
                                ></div>
                              </div>
                              <span className="w-12 text-left font-mono font-bold text-white text-[10px]">
                                {activePlayer2.stats[item.key]}{item.unit}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-black/30 p-3 rounded-xl border border-white/5 text-[10px] text-gray-400 mt-4 leading-relaxed">
                  <span className="font-bold text-rcb-gold block mb-0.5">🧠 AI Matchup Insight:</span>
                  {selectedPlayer1Id === 'virat-kohli' && selectedPlayer2Id === 'shubman-gill' 
                    ? 'Kohli provides anchor security (64.2 chase avg) but Gill carries a higher boundary density (19.5%) in the early Powerplays.' 
                    : 'The performance profiles reveal significant contrasts in pressure handling and boundary percentage.'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AI Fantasy Assistant */}
        {activeTab === 'fantasy' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Suggestions Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Captain Suggestion Card */}
              <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-start gap-4">
                <div className="p-3 bg-rcb-gold/10 rounded-xl border border-rcb-gold/20 text-rcb-gold mt-1">
                  <Award className="w-6 h-6 fill-current" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AI Captain Pick</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{fantasyData.suggestions.captain.name}</h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    {fantasyData.suggestions.captain.reason}
                  </p>
                </div>
              </div>

              {/* VC Suggestion Card */}
              <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400 mt-1">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AI Vice-Captain Pick</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">{fantasyData.suggestions.viceCaptain.name}</h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    {fantasyData.suggestions.viceCaptain.reason}
                  </p>
                </div>
              </div>

              {/* Differentials Card */}
              <div className="glass-card p-5 rounded-2xl border border-white/5 flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/20 text-green-400 mt-1">
                  <Zap className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">AI Differential Pick</span>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {fantasyData.suggestions.differentials[0].name}
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    {fantasyData.suggestions.differentials[0].reason}
                  </p>
                </div>
              </div>

            </div>

            {/* Squad Builder Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Player pool selector - 7 cols */}
              <div className="lg:col-span-7 glass-card p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
                  <div>
                    <h3 className="text-sm font-bold font-display uppercase tracking-widest text-gray-400">Player Credit Pool</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">Select players under the 100 Credit limit</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={autoFillSquad} 
                      className="px-3 py-1.5 rounded-lg bg-rcb-gold/15 text-rcb-gold border border-rcb-gold/30 hover:bg-rcb-gold/25 text-[10px] font-bold tracking-wide transition-all"
                    >
                      🔮 Auto-Fill Squad
                    </button>
                    <button 
                      onClick={clearFantasySquad} 
                      className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 text-[10px] font-bold transition-all"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Player List */}
                <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 scrollbar-thin">
                  {fantasyData.players.map(p => {
                    const isSelected = selectedFantasyPlayers.some(s => s.name === p.name);
                    return (
                      <div 
                        key={p.name} 
                        onClick={() => toggleFantasyPlayer(p)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-[#18233b] border-[#3b82f6]/40 shadow-inner' 
                            : 'bg-black/15 border-white/5 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase font-mono ${p.team === 'RCB' ? 'bg-rcb-red text-white' : 'bg-blue-900 text-white'}`}>
                            {p.team}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              {p.name}
                              {p.isDifferential && <span className="text-[8px] bg-green-500/20 text-green-400 px-1 py-0.2 rounded font-mono border border-green-500/30">DIFF</span>}
                            </span>
                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider block mt-0.5">{p.role} • Selected by {p.selectedBy}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[9px] text-gray-500 block uppercase">Credits</span>
                            <span className="text-xs font-bold text-white font-mono">{p.credits}</span>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[9px] text-gray-500 block uppercase">Rating</span>
                            <span className="text-xs font-bold text-rcb-gold font-mono">{p.rating}</span>
                          </div>

                          <div className={`p-1.5 rounded-lg border transition-all ${
                            isSelected 
                              ? 'bg-blue-500 border-blue-500 text-white' 
                              : 'border-white/10 text-gray-500 hover:text-white hover:border-white/30'
                          }`}>
                            {isSelected ? <CheckCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Squad Auditor Sidebar - 5 cols */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* AI Squad Audit Widget */}
                <div className={`glass-card p-6 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${
                  fantasyStats.status === 'success' 
                    ? 'border-green-500/30' 
                    : fantasyStats.status === 'error' 
                      ? 'border-red-500/30' 
                      : fantasyStats.status === 'warning' 
                        ? 'border-yellow-500/30' 
                        : 'border-white/5'
                }`}>
                  <div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
                      <h3 className="text-sm font-bold font-display uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-rcb-gold" /> AI Squad Auditor
                      </h3>
                      <div className="text-right">
                        <span className="text-[8px] text-gray-500 uppercase block font-bold">AI Rating</span>
                        <span className={`text-xl font-extrabold font-mono ${
                          fantasyStats.status === 'success' ? 'text-green-400' : 'text-rcb-gold'
                        }`}>{fantasyStats.rating}/10</span>
                      </div>
                    </div>

                    {/* Feedback box */}
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                      fantasyStats.status === 'success' 
                        ? 'bg-green-500/10 border-green-500/25 text-green-300' 
                        : fantasyStats.status === 'error' 
                          ? 'bg-red-500/10 border-red-500/25 text-red-300' 
                          : fantasyStats.status === 'warning' 
                            ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-300' 
                            : 'bg-blue-500/10 border-blue-500/25 text-blue-300'
                    }`}>
                      {fantasyStats.feedback}
                    </div>

                    {/* Stats List */}
                    <div className="grid grid-cols-2 gap-4 mt-6 text-xs border-t border-white/5 pt-4">
                      <div>
                        <span className="text-gray-500 block uppercase text-[9px] font-bold">Selected Players</span>
                        <span className="text-base font-extrabold text-white font-mono">{fantasyStats.count} <span className="text-[10px] text-gray-500">/ 11</span></span>
                      </div>
                      <div>
                        <span className="text-gray-500 block uppercase text-[9px] font-bold">Credits Used</span>
                        <span className={`text-base font-extrabold font-mono ${
                          fantasyStats.creditsUsed > fantasyBudget ? 'text-red-500' : 'text-white'
                        }`}>{fantasyStats.creditsUsed.toFixed(1)} <span className="text-[10px] text-gray-500">/ {fantasyBudget}</span></span>
                      </div>
                      <div>
                        <span className="text-gray-500 block uppercase text-[9px] font-bold">RCB / GT split</span>
                        <span className="text-base font-extrabold text-white font-mono">{fantasyStats.rcbCount} <span className="text-xs text-gray-400">RCB</span> : {fantasyStats.gtCount} <span className="text-xs text-gray-400">GT</span></span>
                      </div>
                      <div>
                        <span className="text-gray-500 block uppercase text-[9px] font-bold">Squad balance</span>
                        <div className="text-[10px] font-bold font-mono text-gray-300 mt-0.5 space-x-1.5">
                          <span>WK: {fantasyStats.roles.WK}</span>
                          <span>BAT: {fantasyStats.roles.BAT}</span>
                          <span>AR: {fantasyStats.roles.AR}</span>
                          <span>BOWL: {fantasyStats.roles.BOWL}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Built Squad List */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-400 border-b border-white/5 pb-2 mb-3 tracking-widest">
                      Your Selected XI ({selectedFantasyPlayers.length})
                    </h3>

                    {selectedFantasyPlayers.length === 0 ? (
                      <div className="py-12 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                        <Users className="w-8 h-8 opacity-25" />
                        No players selected. Build your squad by clicking on players in the pool.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                        {selectedFantasyPlayers.map(p => {
                          const isCap = captainId === p.name;
                          const isVc = viceCaptainId === p.name;
                          return (
                            <div key={p.name} className="flex items-center justify-between bg-black/30 p-2 rounded-lg text-xs border border-white/5">
                              <span className="font-semibold text-white flex items-center gap-1.5">
                                {p.name}
                                {isCap && <span className="px-1 py-0.2 bg-rcb-gold text-black text-[8px] font-black rounded-md">C</span>}
                                {isVc && <span className="px-1 py-0.2 bg-blue-500 text-white text-[8px] font-black rounded-md">VC</span>}
                              </span>

                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setCaptainId(p.name);
                                    if (viceCaptainId === p.name) setViceCaptainId(null);
                                  }}
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded border transition-all ${
                                    isCap 
                                      ? 'bg-rcb-gold border-rcb-gold text-black' 
                                      : 'border-white/10 text-gray-400 hover:text-white'
                                  }`}
                                  title="Make Captain"
                                >
                                  C
                                </button>
                                <button
                                  onClick={() => {
                                    setViceCaptainId(p.name);
                                    if (captainId === p.name) setCaptainId(null);
                                  }}
                                  className={`text-[9px] font-black px-1.5 py-0.5 rounded border transition-all ${
                                    isVc 
                                      ? 'bg-blue-500 border-blue-500 text-white' 
                                      : 'border-white/10 text-gray-400 hover:text-white'
                                  }`}
                                  title="Make Vice Captain"
                                >
                                  VC
                                </button>
                                <button 
                                  onClick={() => toggleFantasyPlayer(p)}
                                  className="p-1 rounded text-red-400 hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 4: Long-Term Trend Discovery */}
        {activeTab === 'trends' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Venue Insights Box */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold font-display uppercase tracking-widest text-gray-400 flex items-center gap-1.5 border-b border-white/5 pb-3">
                    <MapPin className="w-4 h-4 text-rcb-gold" /> Venue Intelligence
                  </h3>
                  <p className="text-xs font-bold text-white mt-3 font-display">{venueInsights.venueName}</p>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {venueInsights.stats.map((s, idx) => (
                      <div key={idx} className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-center">
                        <span className="text-gray-500 text-[8px] font-bold uppercase tracking-wider block">{s.label}</span>
                        <span className="text-xs font-extrabold text-white mt-0.5 inline-block">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-black/30 p-3.5 rounded-xl border border-white/5 text-[10px] text-gray-400 mt-4 leading-relaxed">
                  <span className="font-bold text-rcb-gold block mb-1">💡 Toss Strategy Recommendation:</span>
                  Ahmedabad matches under lighting require chasing. The dew index after 8:30 PM reduces spin friction by 24%, boosting batsmen strike rates in the 2nd innings. Winning the toss and bowling is a critical win factor.
                </div>
              </div>

              {/* Trend charts / Pitch breakdown */}
              <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5">
                <h3 className="text-sm font-bold font-display uppercase tracking-wider text-gray-400 mb-4 border-b border-white/5 pb-2">
                  Pitch & Dismissal Characteristics
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pace vs Spin wickets */}
                  <div>
                    <span className="text-xs font-bold text-gray-400 block mb-3">Wicket Distribution by Bowling Type (Ahmedabad)</span>
                    <div className="h-48 w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Pacers', wickets: 68, fill: '#3b82f6' },
                          { name: 'Spinners', wickets: 32, fill: '#10b981' }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                          <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(val) => `${val}%`} />
                          <Bar dataKey="wickets" radius={[6, 6, 0, 0]}>
                            {
                              [
                                { fill: '#3b82f6' },
                                { fill: '#10b981' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chasing success */}
                  <div>
                    <span className="text-xs font-bold text-gray-400 block mb-3">Batting Order Success Rate (Ahmedabad Playoffs)</span>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Batting First', winRate: 42, fill: '#ef4444' },
                          { name: 'Chasing Second', winRate: 58, fill: '#10b981' }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                          <XAxis dataKey="name" stroke="#9ca3af" fontSize={10} />
                          <YAxis stroke="#9ca3af" fontSize={10} tickFormatter={(val) => `${val}%`} />
                          <Bar dataKey="winRate" radius={[6, 6, 0, 0]}>
                            {
                              [
                                { fill: '#ef4444' },
                                { fill: '#10b981' }
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Pattern Discovery details */}
            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <h3 className="text-sm font-bold font-display uppercase tracking-wider text-gray-400 mb-4 border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rcb-gold" /> AI Trend Analysis & Hidden Patterns
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs mt-4">
                <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="font-bold text-rcb-gold flex items-center gap-1">
                    <Flame className="w-4 h-4" /> Batter Trend: Kohli vs Spin
                  </span>
                  <p className="text-gray-300 leading-relaxed">
                    Virat Kohli has scored <strong className="text-white font-bold">72% of his runs</strong> against pace bowlers in the Powerplay over his last 10 matches. In the middle overs, his strike rate drops to 122.4 against spin, suggesting GT should bowling Rashid Khan immediately when Kohli enters his middle overs phase.
                  </p>
                </div>

                <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="font-bold text-rcb-gold flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" /> Team Trend: RCB Chasing
                  </span>
                  <p className="text-gray-300 leading-relaxed">
                    RCB's win probability spikes from <strong className="text-white font-bold">54% to 71%</strong> when chasing targets above 180 runs. Their squad DNA is optimized for run containment and late-over pacing, heavily driven by Karthik and Kohli's finishing dynamics.
                  </p>
                </div>

                <div className="bg-black/25 p-4 rounded-xl border border-white/5 space-y-2">
                  <span className="font-bold text-rcb-gold flex items-center gap-1">
                    <Zap className="w-4 h-4" /> Team Trend: GT Powerplay
                  </span>
                  <p className="text-gray-300 leading-relaxed">
                    Gujarat Titans have a <strong className="text-white font-bold">78% win probability</strong> when crossing 60 runs in the Powerplay. Gill's strike rate during these 6 overs averages 158.5, indicating RCB's bowlers must take early wickets to prevent GT from getting in front.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Team DNA Analyzer */}
        {activeTab === 'dna' && (
          <div className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* DNA Radar Chart Comparison - 7 cols */}
              <div className="lg:col-span-7 glass-card p-6 rounded-2xl border border-white/5">
                <div className="border-b border-white/5 pb-4 mb-4">
                  <h3 className="text-sm font-bold font-display uppercase tracking-widest text-gray-400">Team DNA Profile</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Statistical comparison of tactical identities</p>
                </div>

                <div className="h-80 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={teamDnaChartData}>
                      <PolarGrid stroke="rgba(255,255,255,0.05)" />
                      <PolarAngleAxis dataKey="aspect" stroke="#9CA3AF" fontSize={10} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#4B5563" fontSize={8} />
                      <Radar 
                        name="RCB" 
                        dataKey="RCB" 
                        stroke="#C91D2E" 
                        fill="#C91D2E" 
                        fillOpacity={0.25} 
                      />
                      <Radar 
                        name="GT" 
                        dataKey="GT" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.2} 
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* DNA Info sidebars - 5 cols */}
              <div className="lg:col-span-5 flex flex-col gap-6">
                
                {/* RCB Profile */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rcb-red/5 rounded-full filter blur-[40px] pointer-events-none"></div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rcb-red inline-block"></span>
                      RCB: Play Bold DNA
                    </h4>
                    <span className="text-[9px] font-bold text-rcb-gold uppercase font-mono bg-rcb-gold/10 border border-rcb-gold/20 px-2 py-0.5 rounded-full">Aggressive Chaser</span>
                  </div>
                  
                  <div className="text-xs space-y-3">
                    <p className="text-gray-300 leading-relaxed">
                      <strong>Tactical Summary</strong>: {teamDNA.RCB.keyTactics}
                    </p>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Key Strengths</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {teamDNA.RCB.strengths.map((s, idx) => (
                          <span key={idx} className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[9px] font-semibold">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* GT Profile */}
                <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full filter blur-[40px] pointer-events-none"></div>
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-white font-display flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>
                      GT: Titans Defense DNA
                    </h4>
                    <span className="text-[9px] font-bold text-blue-400 uppercase font-mono bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">Defensive Squeezer</span>
                  </div>

                  <div className="text-xs space-y-3">
                    <p className="text-gray-300 leading-relaxed">
                      <strong>Tactical Summary</strong>: {teamDNA.GT.keyTactics}
                    </p>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Key Strengths</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {teamDNA.GT.strengths.map((s, idx) => (
                          <span key={idx} className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[9px] font-semibold">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

      </main>

      {/* Footer Info */}
      <footer className="mt-12 text-center text-[10px] text-gray-500 font-medium tracking-wide">
        <p>⚡ Antigravity Analytics Dashboard Project | Google Hackathon | Powered by React, Recharts, and Tailwind CSS</p>
        <p className="mt-1 text-rcb-gold font-bold">🏆 RCB: Champion of the 2026 Finals Chase Simulation 🏆</p>
      </footer>

    </div>
  );
}
