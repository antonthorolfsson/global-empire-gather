
import React, { useState } from 'react';
import GameMap from './GameMap';
import EmpireStats from './EmpireStats';
import PlayerLogin from './PlayerLogin';
import CountrySelectionPane from './CountrySelectionPane';
import { useGameState, Player } from '@/hooks/useGameState';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
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
      <div className="flex h-screen flex-col">
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

        {/* 3-Column Layout */}
        <div className="flex-1 overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Left Panel - Country Selection */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-card/95 backdrop-blur-sm">
              <CountrySelectionPane
                countries={gameState.countries}
                onCountrySelect={selectCountry}
                currentPlayer={currentPlayer?.name || ''}
                players={gameState.players}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Center Panel - Map */}
            <ResizablePanel defaultSize={50} minSize={40} maxSize={70}>
              <GameMap
                countries={gameState.countries}
                onCountrySelect={selectCountry}
                currentPlayer={currentPlayer?.name || ''}
                selectedCountries={selectedCountries}
                players={gameState.players}
              />
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Panel - Empire Stats */}
            <ResizablePanel defaultSize={25} minSize={20} maxSize={40} className="bg-card/95 backdrop-blur-sm">
              <EmpireStats
                players={gameState.players}
                countries={gameState.countries}
                currentPlayer={currentPlayer}
                gamePhase={gameState.gamePhase}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
};

export default GameLayout;
