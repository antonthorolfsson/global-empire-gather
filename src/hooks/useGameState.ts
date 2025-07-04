import { useState, useCallback } from 'react';

export interface Country {
  id: string;
  name: string;
  population: number;
  area: number;
  gdp: number;
  owner?: string;
}

export interface Player {
  id: string;
  name: string;
  countries: string[];
  isActive: boolean;
}

export interface GameState {
  players: Player[];
  countries: Country[];
  currentPlayerIndex: number;
  gamePhase: 'setup' | 'selection' | 'finished';
  totalCountries: number;
}

// Mock world data for prototype
const WORLD_COUNTRIES: Country[] = [
  { id: 'us', name: 'United States', population: 331900000, area: 9833517, gdp: 23315 },
  { id: 'ca', name: 'Canada', population: 38010000, area: 9984670, gdp: 1736 },
  { id: 'mx', name: 'Mexico', population: 128900000, area: 1964375, gdp: 1293 },
  { id: 'br', name: 'Brazil', population: 215300000, area: 8514877, gdp: 1869 },
  { id: 'ar', name: 'Argentina', population: 45380000, area: 2780400, gdp: 449 },
  { id: 'uk', name: 'United Kingdom', population: 67220000, area: 243610, gdp: 2827 },
  { id: 'fr', name: 'France', population: 67750000, area: 551695, gdp: 2603 },
  { id: 'de', name: 'Germany', population: 83190000, area: 357022, gdp: 3846 },
  { id: 'ru', name: 'Russia', population: 146200000, area: 17098242, gdp: 1834 },
  { id: 'cn', name: 'China', population: 1412000000, area: 9596960, gdp: 14723 },
  { id: 'in', name: 'India', population: 1380000000, area: 3287263, gdp: 2875 },
  { id: 'jp', name: 'Japan', population: 125800000, area: 377944, gdp: 4231 },
  { id: 'au', name: 'Australia', population: 25690000, area: 7692024, gdp: 1393 },
  { id: 'za', name: 'South Africa', population: 60420000, area: 1221037, gdp: 419 },
  { id: 'eg', name: 'Egypt', population: 104300000, area: 1001449, gdp: 404 },
];

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>({
    players: [
      { id: 'player1', name: 'You', countries: [], isActive: true },
      { id: 'player2', name: 'Opponent', countries: [], isActive: false },
    ],
    countries: WORLD_COUNTRIES,
    currentPlayerIndex: 0,
    gamePhase: 'selection',
    totalCountries: WORLD_COUNTRIES.length,
  });

  const selectCountry = useCallback((countryId: string) => {
    setGameState(prev => {
      const currentPlayer = prev.players[prev.currentPlayerIndex];
      
      // Check if country is already selected
      const isAlreadySelected = prev.players.some(player => 
        player.countries.includes(countryId)
      );
      
      if (isAlreadySelected) return prev;

      // Add country to current player
      const updatedPlayers = prev.players.map((player, index) => 
        index === prev.currentPlayerIndex 
          ? { ...player, countries: [...player.countries, countryId] }
          : player
      );

      // Move to next player
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      
      // Check if game is finished
      const totalSelectedCountries = updatedPlayers.reduce(
        (sum, player) => sum + player.countries.length, 
        0
      );
      
      const gamePhase = totalSelectedCountries >= prev.totalCountries ? 'finished' : 'selection';

      return {
        ...prev,
        players: updatedPlayers,
        currentPlayerIndex: nextPlayerIndex,
        gamePhase,
      };
    });
  }, []);

  const getPlayerStats = useCallback((playerId: string) => {
    const player = gameState.players.find(p => p.id === playerId);
    if (!player) return null;

    const playerCountries = gameState.countries.filter(country => 
      player.countries.includes(country.id)
    );

    const totalPopulation = playerCountries.reduce((sum, c) => sum + c.population, 0);
    const totalArea = playerCountries.reduce((sum, c) => sum + c.area, 0);
    const totalGDP = playerCountries.reduce((sum, c) => sum + c.gdp, 0);

    // Calculate rank
    const allPlayerStats = gameState.players.map(p => {
      const pCountries = gameState.countries.filter(c => p.countries.includes(c.id));
      const pGDP = pCountries.reduce((sum, c) => sum + c.gdp, 0);
      return { playerId: p.id, gdp: pGDP };
    });
    
    allPlayerStats.sort((a, b) => b.gdp - a.gdp);
    const rank = allPlayerStats.findIndex(p => p.playerId === playerId) + 1;

    return {
      playerName: player.name,
      countries: player.countries,
      totalPopulation,
      totalArea,
      totalGDP,
      rank,
    };
  }, [gameState]);

  const getCurrentPlayer = useCallback(() => {
    return gameState.players[gameState.currentPlayerIndex];
  }, [gameState]);

  const getAllSelectedCountries = useCallback(() => {
    return gameState.players.flatMap(player => player.countries);
  }, [gameState]);

  const resetGame = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player => ({ ...player, countries: [] })),
      currentPlayerIndex: 0,
      gamePhase: 'selection',
    }));
  }, []);

  return {
    gameState,
    selectCountry,
    getPlayerStats,
    getCurrentPlayer,
    getAllSelectedCountries,
    resetGame,
  };
};