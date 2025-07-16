export interface CountryData {
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

export const GAME_COUNTRIES: CountryData[] = [
  // Major Powers
  { 
    id: "us", name: "United States", population: 331900000, area: 9833517, gdp: 23315,
    militarySize: 1400000, tanks: 6333, aircraft: 13247, navySize: 484,
    energyProduction: 4401, oilProduction: 18.6, gasProduction: 1785,
    religions: [
      { name: "Christianity", percentage: 65 },
      { name: "No Religion", percentage: 23 },
      { name: "Judaism", percentage: 2 },
      { name: "Islam", percentage: 1 }
    ],
    languages: [
      { name: "English", percentage: 78 },
      { name: "Spanish", percentage: 13 },
      { name: "Chinese", percentage: 1 },
      { name: "Other", percentage: 8 }
    ],
    demographics: {
      ageGroups: [
        { range: "0-14", percentage: 18 },
        { range: "15-64", percentage: 65 },
        { range: "65+", percentage: 17 }
      ],
      urbanPopulation: 83,
      literacyRate: 99
    }
  },
  { 
    id: "cn", name: "China", population: 1412000000, area: 9596961, gdp: 17734,
    militarySize: 2035000, tanks: 5250, aircraft: 3285, navySize: 777,
    energyProduction: 8355, oilProduction: 4.9, gasProduction: 362,
    religions: [
      { name: "Buddhism", percentage: 18 },
      { name: "No Religion", percentage: 52 },
      { name: "Folk Religion", percentage: 22 },
      { name: "Christianity", percentage: 5 }
    ],
    languages: [
      { name: "Mandarin", percentage: 70 },
      { name: "Wu", percentage: 8 },
      { name: "Yue (Cantonese)", percentage: 5 },
      { name: "Other", percentage: 17 }
    ],
    demographics: {
      ageGroups: [
        { range: "0-14", percentage: 17 },
        { range: "15-64", percentage: 70 },
        { range: "65+", percentage: 13 }
      ],
      urbanPopulation: 64,
      literacyRate: 97
    }
  },
  { 
    id: "jp", name: "Japan", population: 125800000, area: 377975, gdp: 4940,
    militarySize: 247150, tanks: 518, aircraft: 777, navySize: 155,
    energyProduction: 1065, oilProduction: 0.0, gasProduction: 4,
    religions: [
      { name: "Shintoism", percentage: 48 },
      { name: "Buddhism", percentage: 46 },
      { name: "Christianity", percentage: 2 },
      { name: "Other", percentage: 4 }
    ],
    languages: [
      { name: "Japanese", percentage: 99 },
      { name: "Other", percentage: 1 }
    ],
    demographics: {
      ageGroups: [
        { range: "0-14", percentage: 12 },
        { range: "15-64", percentage: 59 },
        { range: "65+", percentage: 29 }
      ],
      urbanPopulation: 92,
      literacyRate: 99
    }
  },
  { 
    id: "de", name: "Germany", population: 83200000, area: 357114, gdp: 4223,
    militarySize: 184001, tanks: 236, aircraft: 617, navySize: 65,
    energyProduction: 612, oilProduction: 0.1, gasProduction: 7,
    religions: [
      { name: "Christianity", percentage: 58 },
      { name: "No Religion", percentage: 38 },
      { name: "Islam", percentage: 3 },
      { name: "Other", percentage: 1 }
    ],
    languages: [
      { name: "German", percentage: 95 },
      { name: "Turkish", percentage: 1.8 },
      { name: "Other", percentage: 3.2 }
    ],
    demographics: {
      ageGroups: [
        { range: "0-14", percentage: 14 },
        { range: "15-64", percentage: 64 },
        { range: "65+", percentage: 22 }
      ],
      urbanPopulation: 77,
      literacyRate: 99
    }
  },
  { 
    id: "in", name: "India", population: 1380000000, area: 3287263, gdp: 3737,
    militarySize: 1455550, tanks: 4292, aircraft: 2102, navySize: 295,
    energyProduction: 1726, oilProduction: 0.8, gasProduction: 49,
    religions: [
      { name: "Hinduism", percentage: 80 },
      { name: "Islam", percentage: 14 },
      { name: "Christianity", percentage: 2 },
      { name: "Other", percentage: 4 }
    ],
    languages: [
      { name: "Hindi", percentage: 44 },
      { name: "English", percentage: 12 },
      { name: "Bengali", percentage: 8 },
      { name: "Other", percentage: 36 }
    ],
    demographics: {
      ageGroups: [
        { range: "0-14", percentage: 26 },
        { range: "15-64", percentage: 67 },
        { range: "65+", percentage: 7 }
      ],
      urbanPopulation: 35,
      literacyRate: 75
    }
  },
  { 
    id: "gb", name: "United Kingdom", population: 67500000, area: 242495, gdp: 3131,
    militarySize: 153290, tanks: 227, aircraft: 693, navySize: 76,
    energyProduction: 323, oilProduction: 1.0, gasProduction: 42,
    religions: [
      { name: "Christianity", percentage: 59 },
      { name: "No Religion", percentage: 25 },
      { name: "Islam", percentage: 5 },
      { name: "Other", percentage: 11 }
    ],
    languages: [
      { name: "English", percentage: 98 },
      { name: "Welsh", percentage: 0.6 },
      { name: "Other", percentage: 1.4 }
    ],
    demographics: {
      ageGroups: [
        { range: "0-14", percentage: 17 },
        { range: "15-64", percentage: 64 },
        { range: "65+", percentage: 19 }
      ],
      urbanPopulation: 84,
      literacyRate: 99
    }
  },
  { 
    id: "fr", name: "France", population: 67750000, area: 551695, gdp: 2938,
    militarySize: 208000, tanks: 222, aircraft: 1248, navySize: 118,
    energyProduction: 537, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "French", 81, 99)
  },
  { 
    id: "it", name: "Italy", population: 59550000, area: 301336, gdp: 2107,
    militarySize: 165500, tanks: 200, aircraft: 557, navySize: 184,
    energyProduction: 280, oilProduction: 0.1, gasProduction: 5,
    ...createDefaultCulturalData("Christianity", "Italian", 71, 99)
  },
  { 
    id: "br", name: "Brazil", population: 215300000, area: 8515767, gdp: 2055,
    militarySize: 334500, tanks: 469, aircraft: 715, navySize: 110,
    energyProduction: 601, oilProduction: 3.8, gasProduction: 40,
    ...createDefaultCulturalData("Christianity", "Portuguese", 87, 93)
  },
  { 
    id: "ca", name: "Canada", population: 38000000, area: 9984670, gdp: 1988,
    militarySize: 67492, tanks: 82, aircraft: 391, navySize: 33,
    energyProduction: 636, oilProduction: 5.5, gasProduction: 173,
    ...createDefaultCulturalData("Christianity", "English", 81, 99)
  },
  { 
    id: "ru", name: "Russia", population: 146200000, area: 17098242, gdp: 1829,
    militarySize: 1014000, tanks: 12950, aircraft: 4163, navySize: 352,
    energyProduction: 1118, oilProduction: 11.3, gasProduction: 679,
    ...createDefaultCulturalData("Christianity", "Russian", 75, 99)
  },
  { 
    id: "kr", name: "South Korea", population: 51780000, area: 100210, gdp: 1811,
    militarySize: 599000, tanks: 2654, aircraft: 1595, navySize: 166,
    energyProduction: 564, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Buddhism", "Korean", 82, 98)
  },
  { 
    id: "tw", name: "Taiwan", population: 23570000, area: 36193, gdp: 669,
    militarySize: 165000, tanks: 1110, aircraft: 400, navySize: 117,
    energyProduction: 270, oilProduction: 0.0, gasProduction: 1,
    ...createDefaultCulturalData("Buddhism", "Mandarin", 79, 99)
  },
  { 
    id: "au", name: "Australia", population: 25700000, area: 7692024, gdp: 1552,
    militarySize: 58206, tanks: 59, aircraft: 467, navySize: 50,
    energyProduction: 270, oilProduction: 0.4, gasProduction: 142,
    ...createDefaultCulturalData("Christianity", "English", 86, 99)
  },
  { 
    id: "es", name: "Spain", population: 47350000, area: 505990, gdp: 1394,
    militarySize: 120350, tanks: 327, aircraft: 531, navySize: 46,
    energyProduction: 275, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Spanish", 81, 98)
  },
  { 
    id: "mx", name: "Mexico", population: 128900000, area: 1964375, gdp: 1289,
    militarySize: 277150, tanks: 0, aircraft: 363, navySize: 189,
    energyProduction: 307, oilProduction: 1.7, gasProduction: 27,
    ...createDefaultCulturalData("Christianity", "Spanish", 81, 95)
  },
  { 
    id: "id", name: "Indonesia", population: 273500000, area: 1904569, gdp: 1289,
    militarySize: 395500, tanks: 103, aircraft: 441, navySize: 221,
    energyProduction: 307, oilProduction: 0.7, gasProduction: 72,
    ...createDefaultCulturalData("Islam", "Indonesian", 56, 96)
  },
  
  // European Countries
  { 
    id: "nl", name: "Netherlands", population: 17440000, area: 41850, gdp: 909,
    militarySize: 35410, tanks: 18, aircraft: 61, navySize: 54,
    energyProduction: 109, oilProduction: 0.0, gasProduction: 24,
    ...createDefaultCulturalData("Christianity", "Dutch", 92, 99)
  },
  { 
    id: "ch", name: "Switzerland", population: 8700000, area: 41285, gdp: 752,
    militarySize: 20000, tanks: 134, aircraft: 30, navySize: 0,
    energyProduction: 63, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "German", 74, 99)
  },
  { 
    id: "tr", name: "Turkey", population: 84340000, area: 783562, gdp: 761,
    militarySize: 425000, tanks: 2445, aircraft: 1067, navySize: 194,
    energyProduction: 304, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "Turkish", 76, 96)
  },
  { 
    id: "be", name: "Belgium", population: 11590000, area: 30528, gdp: 529,
    militarySize: 25000, tanks: 0, aircraft: 60, navySize: 2,
    energyProduction: 87, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Dutch", 98, 99)
  },
  { 
    id: "ie", name: "Ireland", population: 5000000, area: 70273, gdp: 499,
    militarySize: 7520, tanks: 0, aircraft: 17, navySize: 8,
    energyProduction: 29, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "English", 63, 99)
  },
  { 
    id: "at", name: "Austria", population: 9000000, area: 83879, gdp: 433,
    militarySize: 22050, tanks: 56, aircraft: 15, navySize: 0,
    energyProduction: 67, oilProduction: 0.0, gasProduction: 1,
    ...createDefaultCulturalData("Christianity", "German", 59, 99)
  },
  { 
    id: "il", name: "Israel", population: 9450000, area: 20770, gdp: 482,
    militarySize: 169500, tanks: 1370, aircraft: 595, navySize: 65,
    energyProduction: 69, oilProduction: 0.0, gasProduction: 10,
    ...createDefaultCulturalData("Judaism", "Hebrew", 92, 97)
  },
  { 
    id: "no", name: "Norway", population: 5380000, area: 385207, gdp: 482,
    militarySize: 23250, tanks: 36, aircraft: 57, navySize: 70,
    energyProduction: 156, oilProduction: 2.0, gasProduction: 114,
    ...createDefaultCulturalData("Christianity", "Norwegian", 83, 99)
  },
  { 
    id: "se", name: "Sweden", population: 10350000, area: 450295, gdp: 541,
    militarySize: 24400, tanks: 120, aircraft: 138, navySize: 267,
    energyProduction: 159, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Swedish", 88, 99)
  },
  { 
    id: "pl", name: "Poland", population: 37970000, area: 312696, gdp: 679,
    militarySize: 114050, tanks: 247, aircraft: 467, navySize: 83,
    energyProduction: 165, oilProduction: 0.0, gasProduction: 4,
    ...createDefaultCulturalData("Christianity", "Polish", 60, 99)
  },
  { 
    id: "dk", name: "Denmark", population: 5820000, area: 43094, gdp: 355,
    militarySize: 15200, tanks: 0, aircraft: 30, navySize: 20,
    energyProduction: 50, oilProduction: 0.1, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Danish", 88, 99)
  },
  { 
    id: "fi", name: "Finland", population: 5540000, area: 338424, gdp: 269,
    militarySize: 21000, tanks: 100, aircraft: 55, navySize: 270,
    energyProduction: 86, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Finnish", 85, 99)
  },
  { 
    id: "pt", name: "Portugal", population: 10310000, area: 92090, gdp: 253,
    militarySize: 26700, tanks: 37, aircraft: 43, navySize: 12,
    energyProduction: 54, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Portuguese", 67, 96)
  },
  { 
    id: "gr", name: "Greece", population: 10720000, area: 131957, gdp: 189,
    militarySize: 142700, tanks: 1244, aircraft: 614, navySize: 120,
    energyProduction: 53, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Greek", 80, 98)
  },
  { 
    id: "cz", name: "Czech Republic", population: 10700000, area: 78867, gdp: 281,
    militarySize: 26250, tanks: 123, aircraft: 91, navySize: 0,
    energyProduction: 87, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Czech", 74, 99)
  },
  { 
    id: "ro", name: "Romania", population: 19320000, area: 238391, gdp: 249,
    militarySize: 70500, tanks: 726, aircraft: 135, navySize: 25,
    energyProduction: 64, oilProduction: 0.1, gasProduction: 10,
    ...createDefaultCulturalData("Christianity", "Romanian", 54, 99)
  },
  { 
    id: "hu", name: "Hungary", population: 9750000, area: 93028, gdp: 181,
    militarySize: 22700, tanks: 44, aircraft: 12, navySize: 0,
    energyProduction: 30, oilProduction: 0.0, gasProduction: 2,
    ...createDefaultCulturalData("Christianity", "Hungarian", 72, 99)
  },
  { 
    id: "bg", name: "Bulgaria", population: 6950000, area: 110879, gdp: 84,
    militarySize: 27400, tanks: 90, aircraft: 45, navySize: 29,
    energyProduction: 47, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Bulgarian", 75, 98)
  },
  { 
    id: "hr", name: "Croatia", population: 4060000, area: 56594, gdp: 67,
    militarySize: 14325, tanks: 75, aircraft: 25, navySize: 30,
    energyProduction: 13, oilProduction: 0.0, gasProduction: 1,
    ...createDefaultCulturalData("Christianity", "Croatian", 57, 99)
  },
  { 
    id: "sk", name: "Slovakia", population: 5460000, area: 49035, gdp: 118,
    militarySize: 8350, tanks: 30, aircraft: 12, navySize: 0,
    energyProduction: 25, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Slovak", 54, 99)
  },
  { 
    id: "si", name: "Slovenia", population: 2100000, area: 20273, gdp: 54,
    militarySize: 7300, tanks: 54, aircraft: 9, navySize: 0,
    energyProduction: 15, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Slovenian", 55, 99)
  },
  { 
    id: "al", name: "Albania", population: 2838000, area: 28748, gdp: 18,
    militarySize: 8000, tanks: 0, aircraft: 0, navySize: 19,
    energyProduction: 8, oilProduction: 0.02, gasProduction: 0.02,
    ...createDefaultCulturalData("Islam", "Albanian", 62, 98)
  },
  { 
    id: "rs", name: "Serbia", population: 6834000, area: 77474, gdp: 63,
    militarySize: 26250, tanks: 232, aircraft: 31, navySize: 0,
    energyProduction: 36, oilProduction: 0.0, gasProduction: 0.5,
    ...createDefaultCulturalData("Christianity", "Serbian", 56, 99)
  },
  { 
    id: "lt", name: "Lithuania", population: 2800000, area: 65300, gdp: 65,
    militarySize: 20000, tanks: 0, aircraft: 5, navySize: 14,
    energyProduction: 5, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Lithuanian", 68, 99)
  },
  { 
    id: "lv", name: "Latvia", population: 1900000, area: 64589, gdp: 38,
    militarySize: 6000, tanks: 0, aircraft: 4, navySize: 15,
    energyProduction: 7, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Latvian", 68, 99)
  },
  { 
    id: "ee", name: "Estonia", population: 1330000, area: 45228, gdp: 38,
    militarySize: 6400, tanks: 0, aircraft: 4, navySize: 5,
    energyProduction: 13, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Estonian", 69, 99)
  },
  { 
    id: "by", name: "Belarus", population: 9500000, area: 207600, gdp: 63,
    militarySize: 45000, tanks: 515, aircraft: 183, navySize: 0,
    energyProduction: 40, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Belarusian", 79, 99)
  },
  { 
    id: "ba", name: "Bosnia and Herzegovina", population: 3280000, area: 51197, gdp: 20,
    militarySize: 10500, tanks: 85, aircraft: 36, navySize: 0,
    energyProduction: 18, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Bosnian", 49, 98)
  },
  { 
    id: "me", name: "Montenegro", population: 628000, area: 13812, gdp: 5,
    militarySize: 2400, tanks: 30, aircraft: 7, navySize: 5,
    energyProduction: 3, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Montenegrin", 67, 99)
  },
  { 
    id: "mk", name: "North Macedonia", population: 2083000, area: 25713, gdp: 12,
    militarySize: 8000, tanks: 31, aircraft: 4, navySize: 0,
    energyProduction: 6, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Macedonian", 58, 98)
  },
  { 
    id: "md", name: "Moldova", population: 4034000, area: 33846, gdp: 12,
    militarySize: 5150, tanks: 6, aircraft: 7, navySize: 0,
    energyProduction: 1, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Romanian", 42, 99)
  },
  { 
    id: "ge", name: "Georgia", population: 3989000, area: 69700, gdp: 18,
    militarySize: 37000, tanks: 188, aircraft: 7, navySize: 19,
    energyProduction: 13, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Georgian", 60, 99)
  },
  { 
    id: "am", name: "Armenia", population: 3018000, area: 29743, gdp: 14,
    militarySize: 44800, tanks: 160, aircraft: 15, navySize: 0,
    energyProduction: 8, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Armenian", 63, 99)
  },
  { 
    id: "az", name: "Azerbaijan", population: 10110000, area: 86600, gdp: 48,
    militarySize: 126400, tanks: 220, aircraft: 145, navySize: 10,
    energyProduction: 25, oilProduction: 0.8, gasProduction: 24,
    ...createDefaultCulturalData("Islam", "Azerbaijani", 56, 99)
  },
  { 
    id: "xk", name: "Kosovo", population: 1873000, area: 10887, gdp: 8,
    militarySize: 4000, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 6, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "Albanian", 39, 92)
  },
  
  // Middle East & Africa
  { 
    id: "sa", name: "Saudi Arabia", population: 34810000, area: 2149690, gdp: 833,
    militarySize: 227000, tanks: 1062, aircraft: 848, navySize: 55,
    energyProduction: 400, oilProduction: 12.4, gasProduction: 112,
    ...createDefaultCulturalData("Islam", "Arabic", 84, 95)
  },
  { 
    id: "ae", name: "UAE", population: 9890000, area: 83600, gdp: 507,
    militarySize: 65000, tanks: 354, aircraft: 560, navySize: 75,
    energyProduction: 140, oilProduction: 4.2, gasProduction: 62,
    ...createDefaultCulturalData("Islam", "Arabic", 87, 93)
  },
  { 
    id: "ir", name: "Iran", population: 84000000, area: 1648195, gdp: 231,
    militarySize: 610000, tanks: 1996, aircraft: 550, navySize: 398,
    energyProduction: 278, oilProduction: 3.2, gasProduction: 250,
    ...createDefaultCulturalData("Islam", "Persian", 76, 87)
  },
  { 
    id: "iq", name: "Iraq", population: 40220000, area: 438317, gdp: 234,
    militarySize: 193000, tanks: 415, aircraft: 371, navySize: 5,
    energyProduction: 100, oilProduction: 4.4, gasProduction: 11,
    ...createDefaultCulturalData("Islam", "Arabic", 70, 86)
  },
  { 
    id: "kw", name: "Kuwait", population: 4270000, area: 17818, gdp: 135,
    militarySize: 17000, tanks: 368, aircraft: 90, navySize: 38,
    energyProduction: 70, oilProduction: 2.9, gasProduction: 17,
    ...createDefaultCulturalData("Islam", "Arabic", 100, 96)
  },
  { 
    id: "qa", name: "Qatar", population: 2881000, area: 11586, gdp: 167,
    militarySize: 11800, tanks: 30, aircraft: 119, navySize: 87,
    energyProduction: 45, oilProduction: 1.9, gasProduction: 177,
    ...createDefaultCulturalData("Islam", "Arabic", 99, 97)
  },
  { 
    id: "bh", name: "Bahrain", population: 1701000, area: 765, gdp: 38,
    militarySize: 8200, tanks: 180, aircraft: 64, navySize: 60,
    energyProduction: 29, oilProduction: 0.2, gasProduction: 16,
    ...createDefaultCulturalData("Islam", "Arabic", 89, 97)
  },
  { 
    id: "om", name: "Oman", population: 5107000, area: 309500, gdp: 76,
    militarySize: 42600, tanks: 154, aircraft: 128, navySize: 16,
    energyProduction: 33, oilProduction: 0.8, gasProduction: 36,
    ...createDefaultCulturalData("Islam", "Arabic", 86, 93)
  },
  { 
    id: "jo", name: "Jordan", population: 10203000, area: 89342, gdp: 47,
    militarySize: 100500, tanks: 1365, aircraft: 133, navySize: 27,
    energyProduction: 20, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "Arabic", 91, 98)
  },
  { 
    id: "lb", name: "Lebanon", population: 6825000, area: 10452, gdp: 31,
    militarySize: 60000, tanks: 298, aircraft: 81, navySize: 69,
    energyProduction: 18, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "Arabic", 89, 94)
  },
  { 
    id: "sy", name: "Syria", population: 17500000, area: 185180, gdp: 40,
    militarySize: 169000, tanks: 2720, aircraft: 452, navySize: 60,
    energyProduction: 24, oilProduction: 0.024, gasProduction: 3,
    ...createDefaultCulturalData("Islam", "Arabic", 56, 86)
  },
  { 
    id: "ye", name: "Yemen", population: 29826000, area: 527968, gdp: 21,
    militarySize: 40000, tanks: 360, aircraft: 175, navySize: 25,
    energyProduction: 8, oilProduction: 0.06, gasProduction: 1,
    ...createDefaultCulturalData("Islam", "Arabic", 38, 70)
  },
  { 
    id: "ua", name: "Ukraine", population: 44130000, area: 603550, gdp: 200,
    militarySize: 250000, tanks: 858, aircraft: 318, navySize: 38,
    energyProduction: 159, oilProduction: 0.1, gasProduction: 20,
    ...createDefaultCulturalData("Christianity", "Ukrainian", 70, 99)
  },
  { 
    id: "eg", name: "Egypt", population: 102300000, area: 1001450, gdp: 469,
    militarySize: 438500, tanks: 4946, aircraft: 1053, navySize: 319,
    energyProduction: 199, oilProduction: 0.6, gasProduction: 61,
    ...createDefaultCulturalData("Islam", "Arabic", 43, 75)
  },
  { 
    id: "za", name: "South Africa", population: 60420000, area: 1221037, gdp: 419,
    militarySize: 78150, tanks: 195, aircraft: 226, navySize: 47,
    energyProduction: 234, oilProduction: 0.0, gasProduction: 1,
    ...createDefaultCulturalData("Christianity", "English", 67, 87)
  },
  { 
    id: "ng", name: "Nigeria", population: 218500000, area: 923768, gdp: 432,
    militarySize: 135000, tanks: 365, aircraft: 99, navySize: 75,
    energyProduction: 29, oilProduction: 1.8, gasProduction: 50,
    ...createDefaultCulturalData("Christianity", "English", 52, 62)
  },
  { 
    id: "ma", name: "Morocco", population: 37460000, area: 446550, gdp: 134,
    militarySize: 195800, tanks: 787, aircraft: 245, navySize: 121,
    energyProduction: 29, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "Arabic", 63, 74)
  },
  { 
    id: "ke", name: "Kenya", population: 54000000, area: 580367, gdp: 110,
    militarySize: 24120, tanks: 76, aircraft: 37, navySize: 18,
    energyProduction: 11, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "English", 28, 79)
  },
  { 
    id: "gh", name: "Ghana", population: 32830000, area: 238533, gdp: 77,
    militarySize: 15500, tanks: 6, aircraft: 13, navySize: 32,
    energyProduction: 16, oilProduction: 0.2, gasProduction: 1,
    ...createDefaultCulturalData("Christianity", "English", 57, 79)
  },
  { 
    id: "et", name: "Ethiopia", population: 117900000, area: 1104300, gdp: 107,
    militarySize: 138000, tanks: 246, aircraft: 84, navySize: 0,
    energyProduction: 15, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Amharic", 22, 51)
  },
  { 
    id: "tn", name: "Tunisia", population: 11820000, area: 163610, gdp: 46,
    militarySize: 35800, tanks: 84, aircraft: 154, navySize: 25,
    energyProduction: 19, oilProduction: 0.1, gasProduction: 2,
    ...createDefaultCulturalData("Islam", "Arabic", 69, 81)
  },
  { 
    id: "ly", name: "Libya", population: 6870000, area: 1759540, gdp: 25,
    militarySize: 18000, tanks: 300, aircraft: 13, navySize: 35,
    energyProduction: 34, oilProduction: 1.2, gasProduction: 9,
    ...createDefaultCulturalData("Islam", "Arabic", 81, 91)
  },
  { 
    id: "dz", name: "Algeria", population: 44700000, area: 2381741, gdp: 151,
    militarySize: 130000, tanks: 1050, aircraft: 551, navySize: 85,
    energyProduction: 82, oilProduction: 1.0, gasProduction: 100,
    ...createDefaultCulturalData("Islam", "Arabic", 73, 81)
  },
  
  // Asia Pacific
  { 
    id: "th", name: "Thailand", population: 69800000, area: 513120, gdp: 543,
    militarySize: 360850, tanks: 737, aircraft: 555, navySize: 293,
    energyProduction: 187, oilProduction: 0.5, gasProduction: 39,
    ...createDefaultCulturalData("Buddhism", "Thai", 51, 93)
  },
  { 
    id: "sg", name: "Singapore", population: 5850000, area: 719, gdp: 397,
    militarySize: 72500, tanks: 170, aircraft: 247, navySize: 40,
    energyProduction: 53, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Buddhism", "English", 100, 97)
  },
  { 
    id: "my", name: "Malaysia", population: 32370000, area: 329847, gdp: 432,
    militarySize: 113000, tanks: 48, aircraft: 134, navySize: 101,
    energyProduction: 169, oilProduction: 0.6, gasProduction: 76,
    ...createDefaultCulturalData("Islam", "Malay", 77, 95)
  },
  { 
    id: "ph", name: "Philippines", population: 109600000, area: 300000, gdp: 394,
    militarySize: 125000, tanks: 0, aircraft: 211, navySize: 82,
    energyProduction: 106, oilProduction: 0.0, gasProduction: 4,
    ...createDefaultCulturalData("Christianity", "Filipino", 47, 98)
  },
  { 
    id: "vn", name: "Vietnam", population: 97340000, area: 331212, gdp: 409,
    militarySize: 482000, tanks: 1315, aircraft: 289, navySize: 65,
    energyProduction: 245, oilProduction: 0.2, gasProduction: 8,
    ...createDefaultCulturalData("Buddhism", "Vietnamese", 37, 95)
  },
  { 
    id: "bd", name: "Bangladesh", population: 166300000, area: 147570, gdp: 460,
    militarySize: 160000, tanks: 320, aircraft: 203, navySize: 117,
    energyProduction: 82, oilProduction: 0.0, gasProduction: 30,
    ...createDefaultCulturalData("Islam", "Bengali", 38, 75)
  },
  { 
    id: "pk", name: "Pakistan", population: 225200000, area: 881913, gdp: 347,
    militarySize: 654000, tanks: 2924, aircraft: 1387, navySize: 197,
    energyProduction: 138, oilProduction: 0.1, gasProduction: 40,
    ...createDefaultCulturalData("Islam", "Urdu", 37, 59)
  },
  { 
    id: "lk", name: "Sri Lanka", population: 21920000, area: 65610, gdp: 84,
    militarySize: 346000, tanks: 62, aircraft: 22, navySize: 45,
    energyProduction: 16, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Buddhism", "Sinhala", 18, 92)
  },
  { 
    id: "np", name: "Nepal", population: 29600000, area: 147181, gdp: 36,
    militarySize: 95000, tanks: 0, aircraft: 5, navySize: 0,
    energyProduction: 5, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Hinduism", "Nepali", 21, 68)
  },
  { 
    id: "mm", name: "Myanmar", population: 54410000, area: 676578, gdp: 76,
    militarySize: 406000, tanks: 150, aircraft: 293, navySize: 155,
    energyProduction: 21, oilProduction: 0.0, gasProduction: 20,
    ...createDefaultCulturalData("Buddhism", "Burmese", 31, 76)
  },
  { 
    id: "kh", name: "Cambodia", population: 16720000, area: 181035, gdp: 27,
    militarySize: 124300, tanks: 150, aircraft: 24, navySize: 11,
    energyProduction: 7, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Buddhism", "Khmer", 24, 81)
  },
  { 
    id: "la", name: "Laos", population: 7320000, area: 236800, gdp: 19,
    militarySize: 29100, tanks: 130, aircraft: 35, navySize: 0,
    energyProduction: 29, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Buddhism", "Lao", 36, 85)
  },
  { 
    id: "kz", name: "Kazakhstan", population: 19400000, area: 2724900, gdp: 197,
    militarySize: 39000, tanks: 300, aircraft: 120, navySize: 0,
    energyProduction: 107, oilProduction: 1.8, gasProduction: 24,
    ...createDefaultCulturalData("Islam", "Kazakh", 58, 100)
  },
  { 
    id: "uz", name: "Uzbekistan", population: 33580000, area: 448978, gdp: 69,
    militarySize: 48000, tanks: 340, aircraft: 135, navySize: 0,
    energyProduction: 58, oilProduction: 0.06, gasProduction: 56,
    ...createDefaultCulturalData("Islam", "Uzbek", 50, 100)
  },
  { 
    id: "tm", name: "Turkmenistan", population: 6031000, area: 488100, gdp: 45,
    militarySize: 36500, tanks: 650, aircraft: 90, navySize: 0,
    energyProduction: 22, oilProduction: 0.24, gasProduction: 77,
    ...createDefaultCulturalData("Islam", "Turkmen", 53, 100)
  },
  { 
    id: "tj", name: "Tajikistan", population: 9750000, area: 143100, gdp: 8,
    militarySize: 8800, tanks: 37, aircraft: 25, navySize: 0,
    energyProduction: 17, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "Tajik", 27, 100)
  },
  { 
    id: "mn", name: "Mongolia", population: 3280000, area: 1564110, gdp: 14,
    militarySize: 10000, tanks: 470, aircraft: 11, navySize: 0,
    energyProduction: 5, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Buddhism", "Mongolian", 69, 98)
  },
  { 
    id: "bn", name: "Brunei", population: 438000, area: 5765, gdp: 12,
    militarySize: 7000, tanks: 20, aircraft: 17, navySize: 17,
    energyProduction: 4, oilProduction: 0.1, gasProduction: 13,
    ...createDefaultCulturalData("Islam", "Malay", 78, 96)
  },
  { 
    id: "ps", name: "Palestine", population: 5222000, area: 6020, gdp: 18,
    militarySize: 0, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 1, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "Arabic", 77, 97)
  },
  { 
    id: "bb", name: "Barbados", population: 287000, area: 430, gdp: 5,
    militarySize: 610, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 1, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "English", 31, 100)
  },
  { 
    id: "rw", name: "Rwanda", population: 13280000, area: 26338, gdp: 11,
    militarySize: 33000, tanks: 12, aircraft: 0, navySize: 0,
    energyProduction: 1, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Kinyarwanda", 17, 73)
  },
  
  // Americas
  { 
    id: "ar", name: "Argentina", population: 45380000, area: 2780400, gdp: 490,
    militarySize: 83000, tanks: 231, aircraft: 201, navySize: 39,
    energyProduction: 141, oilProduction: 0.8, gasProduction: 40,
    ...createDefaultCulturalData("Christianity", "Spanish", 92, 99)
  },
  { 
    id: "cl", name: "Chile", population: 19120000, area: 756096, gdp: 317,
    militarySize: 77200, tanks: 140, aircraft: 186, navySize: 66,
    energyProduction: 79, oilProduction: 0.0, gasProduction: 1,
    ...createDefaultCulturalData("Christianity", "Spanish", 85, 97)
  },
  { 
    id: "pe", name: "Peru", population: 33000000, area: 1285216, gdp: 223,
    militarySize: 81000, tanks: 85, aircraft: 101, navySize: 60,
    energyProduction: 56, oilProduction: 0.1, gasProduction: 14,
    ...createDefaultCulturalData("Christianity", "Spanish", 78, 94)
  },
  { 
    id: "co", name: "Colombia", population: 50880000, area: 1141748, gdp: 314,
    militarySize: 295000, tanks: 0, aircraft: 454, navySize: 187,
    energyProduction: 74, oilProduction: 0.9, gasProduction: 12,
    ...createDefaultCulturalData("Christianity", "Spanish", 81, 95)
  },
  { 
    id: "ve", name: "Venezuela", population: 28440000, area: 912050, gdp: 482,
    militarySize: 123000, tanks: 390, aircraft: 472, navySize: 79,
    energyProduction: 109, oilProduction: 0.8, gasProduction: 32,
    ...createDefaultCulturalData("Christianity", "Spanish", 88, 97)
  },
  { 
    id: "ec", name: "Ecuador", population: 17640000, area: 283561, gdp: 107,
    militarySize: 40250, tanks: 140, aircraft: 89, navySize: 45,
    energyProduction: 31, oilProduction: 0.5, gasProduction: 1,
    ...createDefaultCulturalData("Christianity", "Spanish", 64, 93)
  },
  { 
    id: "uy", name: "Uruguay", population: 3470000, area: 176215, gdp: 60,
    militarySize: 24650, tanks: 17, aircraft: 21, navySize: 31,
    energyProduction: 14, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Spanish", 95, 98)
  },
  { 
    id: "py", name: "Paraguay", population: 7130000, area: 406752, gdp: 40,
    militarySize: 10650, tanks: 0, aircraft: 19, navySize: 36,
    energyProduction: 63, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Spanish", 62, 94)
  },
  { 
    id: "bo", name: "Bolivia", population: 11670000, area: 1098581, gdp: 43,
    militarySize: 46100, tanks: 54, aircraft: 93, navySize: 173,
    energyProduction: 9, oilProduction: 0.1, gasProduction: 19,
    ...createDefaultCulturalData("Christianity", "Spanish", 70, 92)
  },
  
  // Rest of the world
  { 
    id: "nz", name: "New Zealand", population: 5120000, area: 268838, gdp: 249,
    militarySize: 9000, tanks: 0, aircraft: 48, navySize: 11,
    energyProduction: 43, oilProduction: 0.0, gasProduction: 5,
    ...createDefaultCulturalData("Christianity", "English", 87, 99)
  },
  { 
    id: "is", name: "Iceland", population: 372000, area: 103000, gdp: 27,
    militarySize: 0, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 19, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Icelandic", 94, 99)
  },
  { 
    id: "mt", name: "Malta", population: 520000, area: 316, gdp: 17,
    militarySize: 2000, tanks: 0, aircraft: 0, navySize: 9,
    energyProduction: 2, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Maltese", 95, 94)
  },
  { 
    id: "cy", name: "Cyprus", population: 1210000, area: 9251, gdp: 27,
    militarySize: 12000, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 5, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Greek", 67, 99)
  },
  { 
    id: "lu", name: "Luxembourg", population: 630000, area: 2586, gdp: 73,
    militarySize: 1000, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 3, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Luxembourgish", 91, 99)
  },
  { 
    id: "ad", name: "Andorra", population: 79000, area: 468, gdp: 3,
    militarySize: 0, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 1, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Catalan", 88, 100)
  },
  { 
    id: "mc", name: "Monaco", population: 39000, area: 2, gdp: 7,
    militarySize: 0, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 1, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "French", 100, 99)
  },
  { 
    id: "sm", name: "San Marino", population: 34000, area: 61, gdp: 2,
    militarySize: 0, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 0, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Italian", 97, 96)
  },
  { 
    id: "va", name: "Vatican City", population: 800, area: 0.44, gdp: 1,
    militarySize: 110, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 0, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "Italian", 100, 100)
  },
  { 
    id: "li", name: "Liechtenstein", population: 38000, area: 160, gdp: 7,
    militarySize: 0, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 0, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "German", 14, 100)
  },

  // Liberia
  {
    id: "lr", name: "Liberia", population: 5180000, area: 111369, gdp: 3900,
    militarySize: 2000, tanks: 0, aircraft: 0, navySize: 0,
    energyProduction: 126, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "English", 51, 48)
  },

  // Togo
  {
    id: "tg", name: "Togo", population: 8450000, area: 56785, gdp: 8500,
    militarySize: 8500, tanks: 2, aircraft: 0, navySize: 200,
    energyProduction: 232, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "French", 43, 66)
  },

  // North Korea
  {
    id: "kp", name: "North Korea", population: 25800000, area: 120538, gdp: 40,
    militarySize: 1280000, tanks: 3500, aircraft: 572, navySize: 60000,
    energyProduction: 23000, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Buddhism", "Korean", 62, 99)
  },

  // Additional African Countries
  {
    id: "ao", name: "Angola", population: 33900000, area: 1246700, gdp: 94,
    militarySize: 107000, tanks: 140, aircraft: 270, navySize: 57,
    energyProduction: 9, oilProduction: 1.4, gasProduction: 3,
    ...createDefaultCulturalData("Christianity", "Portuguese", 67, 71)
  },
  {
    id: "tz", name: "Tanzania", population: 61500000, area: 947303, gdp: 67,
    militarySize: 27000, tanks: 45, aircraft: 22, navySize: 8,
    energyProduction: 6, oilProduction: 0.0, gasProduction: 2,
    ...createDefaultCulturalData("Christianity", "Swahili", 36, 78)
  },
  {
    id: "ug", name: "Uganda", population: 47100000, area: 241038, gdp: 48,
    militarySize: 45000, tanks: 160, aircraft: 18, navySize: 0,
    energyProduction: 4, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "English", 26, 73)
  },
  {
    id: "cm", name: "Cameroon", population: 27200000, area: 475442, gdp: 40,
    militarySize: 40000, tanks: 53, aircraft: 35, navySize: 40,
    energyProduction: 8, oilProduction: 0.1, gasProduction: 1,
    ...createDefaultCulturalData("Christianity", "French", 58, 75)
  },
  {
    id: "sd", name: "Sudan", population: 45700000, area: 1861484, gdp: 35,
    militarySize: 104300, tanks: 250, aircraft: 175, navySize: 18,
    energyProduction: 14, oilProduction: 0.1, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "Arabic", 35, 60)
  },
  {
    id: "cd", name: "Democratic Republic of Congo", population: 95900000, area: 2344858, gdp: 55,
    militarySize: 134250, tanks: 175, aircraft: 26, navySize: 54,
    energyProduction: 9, oilProduction: 0.02, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "French", 46, 77)
  },
  {
    id: "ci", name: "Ivory Coast", population: 27500000, area: 322463, gdp: 70,
    militarySize: 25400, tanks: 10, aircraft: 7, navySize: 9,
    energyProduction: 9, oilProduction: 0.03, gasProduction: 2,
    ...createDefaultCulturalData("Christianity", "French", 52, 47)
  },
  {
    id: "sn", name: "Senegal", population: 17200000, area: 196722, gdp: 28,
    militarySize: 17000, tanks: 30, aircraft: 17, navySize: 32,
    energyProduction: 4, oilProduction: 0.0, gasProduction: 1,
    ...createDefaultCulturalData("Islam", "French", 48, 43)
  },
  {
    id: "ml", name: "Mali", population: 21900000, area: 1240192, gdp: 19,
    militarySize: 7350, tanks: 33, aircraft: 24, navySize: 50,
    energyProduction: 3, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "French", 44, 35)
  },
  {
    id: "bf", name: "Burkina Faso", population: 22700000, area: 274200, gdp: 18,
    militarySize: 11200, tanks: 30, aircraft: 19, navySize: 0,
    energyProduction: 1, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "French", 31, 36)
  },
  {
    id: "ne", name: "Niger", population: 25300000, area: 1267000, gdp: 14,
    militarySize: 5300, tanks: 65, aircraft: 25, navySize: 0,
    energyProduction: 1, oilProduction: 0.02, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "French", 17, 19)
  },
  {
    id: "td", name: "Chad", population: 17200000, area: 1284000, gdp: 12,
    militarySize: 25350, tanks: 60, aircraft: 2, navySize: 0,
    energyProduction: 0, oilProduction: 0.1, gasProduction: 0,
    ...createDefaultCulturalData("Islam", "French", 23, 23)
  },
  {
    id: "zm", name: "Zambia", population: 19600000, area: 752618, gdp: 22,
    militarySize: 15100, tanks: 30, aircraft: 40, navySize: 0,
    energyProduction: 15, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "English", 45, 63)
  },
  {
    id: "zw", name: "Zimbabwe", population: 15100000, area: 390757, gdp: 28,
    militarySize: 29000, tanks: 30, aircraft: 88, navySize: 0,
    energyProduction: 7, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "English", 32, 87)
  },
  {
    id: "bw", name: "Botswana", population: 2400000, area: 581730, gdp: 18,
    militarySize: 9000, tanks: 80, aircraft: 32, navySize: 0,
    energyProduction: 2, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "English", 71, 88)
  },
  {
    id: "na", name: "Namibia", population: 2500000, area: 824292, gdp: 12,
    militarySize: 9000, tanks: 43, aircraft: 18, navySize: 47,
    energyProduction: 2, oilProduction: 0.0, gasProduction: 0,
    ...createDefaultCulturalData("Christianity", "English", 53, 91)
  },
  {
    id: "mz", name: "Mozambique", population: 32200000, area: 801590, gdp: 15,
    militarySize: 11200, tanks: 80, aircraft: 26, navySize: 9,
    energyProduction: 18, oilProduction: 0.0, gasProduction: 5,
    ...createDefaultCulturalData("Christianity", "Portuguese", 38, 60)
  }
];
