const fs = require('fs');

// Read the file
const content = fs.readFileSync('src/data/gameCountries.ts', 'utf8');

// Extract all country objects
const countryMatches = content.match(/{\s*id:\s*"[^"]+",\s*name:\s*"[^"]+",[\s\S]*?}/g);

if (!countryMatches) {
  console.log('No country objects found');
  process.exit(1);
}

// Parse countries and find duplicates
const countries = [];
const seen = new Set();
const duplicates = new Set();

countryMatches.forEach((match, index) => {
  const idMatch = match.match(/id:\s*"([^"]+)"/);
  if (idMatch) {
    const id = idMatch[1];
    if (seen.has(id)) {
      duplicates.add(id);
      console.log(`Duplicate found: ${id}`);
    } else {
      seen.add(id);
    }
    countries.push({ id, content: match, index });
  }
});

console.log(`Total countries found: ${countries.length}`);
console.log(`Unique countries: ${seen.size}`);
console.log(`Duplicates: ${Array.from(duplicates).join(', ')}`);

// Find the first occurrence of each country to keep
const toKeep = new Map();
countries.forEach(country => {
  if (!toKeep.has(country.id)) {
    toKeep.set(country.id, country);
  }
});

console.log(`Countries to keep: ${toKeep.size}`);

// Generate cleaned content
const header = `export interface CountryData {
  id: string;
  name: string;
  population: number;
  area: number; // km²
  gdp: number; // billions USD
  // Military data
  militarySize: number; // active personnel
  tanks: number;
  aircraft: number;
  navySize: number; // naval vessels
  // Resource production (annual)
  energyProduction: number; // TWh (terawatt hours)
  oilProduction: number; // million barrels per day
  gasProduction: number; // billion cubic meters per year
  // Cultural and demographic data
  religions: { name: string; percentage: number }[];
  languages: { name: string; percentage: number }[];
  demographics: {
    ageGroups: { range: string; percentage: number }[];
    urbanPopulation: number; // percentage
    literacyRate: number; // percentage
  };
}

// Helper function to create default cultural data for countries
const createDefaultCulturalData = (majorReligion: string, majorLanguage: string, urbanPop: number = 60, literacy: number = 95) => ({
  religions: [
    { name: majorReligion, percentage: 70 },
    { name: "Other", percentage: 20 },
    { name: "No Religion", percentage: 10 }
  ],
  languages: [
    { name: majorLanguage, percentage: 85 },
    { name: "Other", percentage: 15 }
  ],
  demographics: {
    ageGroups: [
      { range: "0-14", percentage: 25 },
      { range: "15-64", percentage: 65 },
      { range: "65+", percentage: 10 }
    ],
    urbanPopulation: urbanPop,
    literacyRate: literacy
  }
});

export const GAME_COUNTRIES: CountryData[] = [`;

const uniqueCountries = Array.from(toKeep.values());
const countryContents = uniqueCountries.map(country => country.content).join(',\n  ');

const cleanedContent = `${header}\n  ${countryContents}\n];
`;

fs.writeFileSync('src/data/gameCountries.ts', cleanedContent);
console.log(`Cleaned file written with ${uniqueCountries.length} unique countries`);
