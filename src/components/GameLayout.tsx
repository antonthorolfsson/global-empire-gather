import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import GameMap from './GameMap';
import EmpireStats from './EmpireStats';
import { useGameState } from '@/hooks/useGameState';

const GameLayout: React.FC = () => {
  const { 
    gameState, 
    selectCountry, 
    getPlayerStats, 
    getCurrentPlayer, 
    getAllSelectedCountries, 
    resetGame 
  } = useGameState();

  const currentPlayer = getCurrentPlayer();
  const selectedCountries = getAllSelectedCountries();
  const playerStats = getPlayerStats('player1');

  const handleCountrySelect = (countryId: string) => {
    selectCountry(countryId);
  };

  const isGameFinished = gameState.gamePhase === 'finished';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Empire Builder
              </h1>
              <p className="text-muted-foreground">Conquer the world, one territory at a time</p>
            </div>
            
            <div className="flex items-center gap-4">
              {!isGameFinished && (
                <Badge variant="outline" className="bg-primary/10 border-primary text-primary font-semibold px-4 py-2">
                  {currentPlayer?.name}'s Turn
                </Badge>
              )}
              
              {isGameFinished && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-accent text-accent-foreground font-bold px-4 py-2">
                    🎉 Game Complete!
                  </Badge>
                  <Button onClick={resetGame} variant="outline">
                    New Game
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  🌍 World Map
                  <Badge variant="secondary" className="ml-auto">
                    {selectedCountries.length}/{gameState.totalCountries} Claimed
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {isGameFinished 
                    ? "All territories have been claimed! Check your empire stats." 
                    : `Click on countries to add them to ${currentPlayer?.name}'s empire`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 p-4">
                <GameMap
                  countries={gameState.countries}
                  onCountrySelect={handleCountrySelect}
                  currentPlayer={currentPlayer?.name || 'Unknown'}
                  selectedCountries={selectedCountries}
                />
              </CardContent>
            </Card>
          </div>

          {/* Stats Panel */}
          <div className="space-y-4">
            {/* Current Player Stats */}
            {playerStats && (
              <EmpireStats
                playerName={playerStats.playerName}
                countries={playerStats.countries}
                totalPopulation={playerStats.totalPopulation}
                totalArea={playerStats.totalArea}
                totalGDP={playerStats.totalGDP}
                rank={playerStats.rank}
              />
            )}

            {/* Game Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Game Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {gameState.players.map((player, index) => {
                  const stats = getPlayerStats(player.id);
                  if (!stats) return null;

                  return (
                    <div 
                      key={player.id} 
                      className={`p-3 rounded-lg border transition-all ${
                        player.id === currentPlayer?.id 
                          ? 'border-primary bg-primary/5 animate-empire-glow' 
                          : 'border-border bg-muted/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{player.name}</span>
                        <Badge variant="outline" className="text-xs">
                          Rank #{stats.rank}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>🏰 {stats.countries.length} territories</div>
                        <div>👥 {(stats.totalPopulation / 1000000).toFixed(0)}M people</div>
                        <div>💰 ${(stats.totalGDP / 1000).toFixed(0)}B GDP</div>
                      </div>
                    </div>
                  );
                })}

                {isGameFinished && (
                  <div className="pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="text-lg font-bold text-accent">
                        🏆 Final Rankings
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Based on total empire value
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            {!isGameFinished && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="text-sm space-y-2">
                    <div className="font-semibold text-primary">How to Play:</div>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Take turns selecting countries</li>
                      <li>• Build your global empire</li>
                      <li>• Aim for high population & GDP</li>
                      <li>• Compete for world domination!</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GameLayout;