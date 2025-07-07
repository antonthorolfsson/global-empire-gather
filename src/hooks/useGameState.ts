
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
  color: string;
}

export interface GameState {
  players: Player[];
  countries: Country[];
  currentPlayerIndex: number;
  gamePhase: 'setup' | 'selection' | 'finished';
  totalCountries: number;
}

import { getAllCountries } from '../utils/countryData';

// Get all world countries data
const WORLD_COUNTRIES: Country[] = getAllCountries();

export const useGameState = (initialPlayers?: Player[]) => {
  const [gameState, setGameState] = useState<GameState>({
    players: initialPlayers || [],
    countries: WORLD_COUNTRIES,
    currentPlayerIndex: 0,
    gamePhase: initialPlayers ? 'selection' : 'setup',
    totalCountries: WORLD_COUNTRIES.length,
  });

  const initializeGame = useCallback((players: Player[]) => {
    setGameState(prev => ({
      ...prev,
      players: players.map((player, index) => ({
        ...player,
        countries: [],
        isActive: index === 0,
      })),
      currentPlayerIndex: 0,
      gamePhase: 'selection',
    }));
  }, []);

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
  }, [gameState.players, gameState.countries]);

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
    initializeGame,
    selectCountry,
    getPlayerStats,
    getCurrentPlayer,
    getAllSelectedCountries,
    resetGame,
  };
};
