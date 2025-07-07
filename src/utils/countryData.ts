import { GAME_COUNTRIES } from '../data/gameCountries';

export interface CountryData {
  id: string;
  name: string;
  population: number;
  area: number;
  gdp: number;
}

export const getAllCountries = (): CountryData[] => {
  return GAME_COUNTRIES;
};