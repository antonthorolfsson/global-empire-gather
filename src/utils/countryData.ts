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
    id: country.cca2.toLowerCase(), // Use 2-letter country code as ID
    name: country.name.common,
    population: country.population || 0,
    area: country.area || 0,
    // GDP data isn't available in this dataset, so we'll use a formula based on population and area
    gdp: Math.round((country.population || 0) / 1000000 * 50 + (country.area || 0) / 100000)
  })).filter(country => country.population > 0); // Only include countries with population data
};

export const getAllCountries = (): CountryData[] => {
  return processCountryData();
};