import countriesJson from '../data/countries.json';

export interface CountryData {
  id: string;
  name: string;
  population: number;
  area: number;
  gdp: number;
}

// Transform the comprehensive country data into our game format
export const processCountryData = (): CountryData[] => {
  return countriesJson.map((country: any) => ({
    id: country.cca2.toLowerCase(), // Use 2-letter country code as ID to match SVG
    name: country.name.common,
    population: country.population || 0,
    area: country.area || 0,
    // GDP calculation based on population and area with some variation
    gdp: Math.round((country.population || 0) / 1000000 * (30 + Math.random() * 40) + (country.area || 0) / 50000)
  })).filter(country => 
    country.population > 50000 && // Only include countries with significant population
    country.area > 100 // And minimum area
  );
};

export const getAllCountries = (): CountryData[] => {
  return processCountryData();
};