
import React, { useState } from 'react';
import GameMap from './GameMap';
import EmpireStats from './EmpireStats';
import PlayerLogin from './PlayerLogin';
import { useGameState, Player } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

const GameLayout = () => {
  const { gameState, initializeGame, selectCountry, getPlayerStats, getCurrentPlayer, getAllSelectedCountries, resetGame } = useGameState();
  const [gameStarted, setGameStarted] = useState(false);

  const handlePlayersReady = (players: Player[]) => {
    initializeGame(players);
    setGameStarted(true);
  };

  const handleRestart = () => {
    setGameStarted(false);
    resetGame();
  };

  // Show login screen if game hasn't started
  if (!gameStarted || gameState.gamePhase === 'setup') {
    return <PlayerLogin onPlayersReady={handlePlayersReady} />;
  }

  const currentPlayer = getCurrentPlayer();
  const selectedCountries = getAllSelectedCountries();

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean to-primary">
      <div className="flex h-screen">
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 bg-card/90 backdrop-blur-sm border-b">
            <h1 className="text-xl font-bold text-card-foreground">GeoPolitical Strategy</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {gameState.players.length} Players
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                New Game
              </Button>
            </div>
          </div>

          {/* Game Map */}
          <div className="flex-1">
            <GameMap
              countries={gameState.countries}
              onCountrySelect={selectCountry}
              currentPlayer={currentPlayer?.name || ''}
              selectedCountries={selectedCountries}
              players={gameState.players}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-card/95 backdrop-blur-sm border-l overflow-y-auto">
          <EmpireStats
            players={gameState.players}
            getPlayerStats={getPlayerStats}
            currentPlayer={currentPlayer}
            gamePhase={gameState.gamePhase}
          />
        </div>
      </div>
    </div>
  );
};

export default GameLayout;
