export interface CountryData {
  id: string;
  name: string;
  population: number;
  area: number; // km²
  gdp: number; // billions USD
}

export const GAME_COUNTRIES: CountryData[] = [
  // Major Powers
  { id: "us", name: "United States", population: 331900000, area: 9833517, gdp: 23315 },
  { id: "cn", name: "China", population: 1412000000, area: 9596961, gdp: 17734 },
  { id: "jp", name: "Japan", population: 125800000, area: 377975, gdp: 4940 },
  { id: "de", name: "Germany", population: 83200000, area: 357114, gdp: 4223 },
  { id: "in", name: "India", population: 1380000000, area: 3287263, gdp: 3737 },
  { id: "gb", name: "United Kingdom", population: 67500000, area: 242495, gdp: 3131 },
  { id: "fr", name: "France", population: 67750000, area: 551695, gdp: 2938 },
  { id: "it", name: "Italy", population: 59550000, area: 301336, gdp: 2107 },
  { id: "br", name: "Brazil", population: 215300000, area: 8515767, gdp: 2055 },
  { id: "ca", name: "Canada", population: 38000000, area: 9984670, gdp: 1988 },
  { id: "ru", name: "Russia", population: 146200000, area: 17098242, gdp: 1829 },
  { id: "kr", name: "South Korea", population: 51780000, area: 100210, gdp: 1811 },
  { id: "au", name: "Australia", population: 25700000, area: 7692024, gdp: 1552 },
  { id: "es", name: "Spain", population: 47350000, area: 505990, gdp: 1394 },
  { id: "mx", name: "Mexico", population: 128900000, area: 1964375, gdp: 1289 },
  { id: "id", name: "Indonesia", population: 273500000, area: 1904569, gdp: 1289 },
  
  // European Countries
  { id: "nl", name: "Netherlands", population: 17440000, area: 41850, gdp: 909 },
  { id: "ch", name: "Switzerland", population: 8700000, area: 41285, gdp: 752 },
  { id: "tr", name: "Turkey", population: 84340000, area: 783562, gdp: 761 },
  { id: "be", name: "Belgium", population: 11590000, area: 30528, gdp: 529 },
  { id: "ie", name: "Ireland", population: 5000000, area: 70273, gdp: 499 },
  { id: "at", name: "Austria", population: 9000000, area: 83879, gdp: 433 },
  { id: "il", name: "Israel", population: 9450000, area: 20770, gdp: 482 },
  { id: "no", name: "Norway", population: 5380000, area: 385207, gdp: 482 },
  { id: "se", name: "Sweden", population: 10350000, area: 450295, gdp: 541 },
  { id: "pl", name: "Poland", population: 37970000, area: 312696, gdp: 679 },
  { id: "dk", name: "Denmark", population: 5820000, area: 43094, gdp: 355 },
  { id: "fi", name: "Finland", population: 5540000, area: 338424, gdp: 269 },
  { id: "pt", name: "Portugal", population: 10310000, area: 92090, gdp: 253 },
  { id: "gr", name: "Greece", population: 10720000, area: 131957, gdp: 189 },
  { id: "cz", name: "Czech Republic", population: 10700000, area: 78867, gdp: 281 },
  { id: "ro", name: "Romania", population: 19320000, area: 238391, gdp: 249 },
  { id: "hu", name: "Hungary", population: 9750000, area: 93028, gdp: 181 },
  { id: "bg", name: "Bulgaria", population: 6950000, area: 110879, gdp: 84 },
  { id: "hr", name: "Croatia", population: 4060000, area: 56594, gdp: 67 },
  { id: "sk", name: "Slovakia", population: 5460000, area: 49035, gdp: 118 },
  { id: "si", name: "Slovenia", population: 2100000, area: 20273, gdp: 54 },
  { id: "lt", name: "Lithuania", population: 2800000, area: 65300, gdp: 65 },
  { id: "lv", name: "Latvia", population: 1900000, area: 64589, gdp: 38 },
  { id: "ee", name: "Estonia", population: 1330000, area: 45228, gdp: 38 },
  
  // Middle East & Africa
  { id: "sa", name: "Saudi Arabia", population: 34810000, area: 2149690, gdp: 833 },
  { id: "ae", name: "UAE", population: 9890000, area: 83600, gdp: 507 },
  { id: "eg", name: "Egypt", population: 102300000, area: 1001450, gdp: 469 },
  { id: "za", name: "South Africa", population: 60420000, area: 1221037, gdp: 419 },
  { id: "ng", name: "Nigeria", population: 218500000, area: 923768, gdp: 432 },
  { id: "ma", name: "Morocco", population: 37460000, area: 446550, gdp: 134 },
  { id: "ke", name: "Kenya", population: 54000000, area: 580367, gdp: 110 },
  { id: "gh", name: "Ghana", population: 32830000, area: 238533, gdp: 77 },
  { id: "et", name: "Ethiopia", population: 117900000, area: 1104300, gdp: 107 },
  { id: "tn", name: "Tunisia", population: 11820000, area: 163610, gdp: 46 },
  { id: "ly", name: "Libya", population: 6870000, area: 1759540, gdp: 25 },
  { id: "dz", name: "Algeria", population: 44700000, area: 2381741, gdp: 151 },
  
  // Asia Pacific
  { id: "th", name: "Thailand", population: 69800000, area: 513120, gdp: 543 },
  { id: "sg", name: "Singapore", population: 5850000, area: 719, gdp: 397 },
  { id: "my", name: "Malaysia", population: 32370000, area: 329847, gdp: 432 },
  { id: "ph", name: "Philippines", population: 109600000, area: 300000, gdp: 394 },
  { id: "vn", name: "Vietnam", population: 97340000, area: 331212, gdp: 409 },
  { id: "bd", name: "Bangladesh", population: 166300000, area: 147570, gdp: 460 },
  { id: "pk", name: "Pakistan", population: 225200000, area: 881913, gdp: 347 },
  { id: "lk", name: "Sri Lanka", population: 21920000, area: 65610, gdp: 84 },
  { id: "np", name: "Nepal", population: 29600000, area: 147181, gdp: 36 },
  { id: "mm", name: "Myanmar", population: 54410000, area: 676578, gdp: 76 },
  { id: "kh", name: "Cambodia", population: 16720000, area: 181035, gdp: 27 },
  { id: "la", name: "Laos", population: 7320000, area: 236800, gdp: 19 },
  
  // Americas
  { id: "ar", name: "Argentina", population: 45380000, area: 2780400, gdp: 490 },
  { id: "cl", name: "Chile", population: 19120000, area: 756096, gdp: 317 },
  { id: "pe", name: "Peru", population: 33000000, area: 1285216, gdp: 223 },
  { id: "co", name: "Colombia", population: 50880000, area: 1141748, gdp: 314 },
  { id: "ve", name: "Venezuela", population: 28440000, area: 912050, gdp: 482 },
  { id: "ec", name: "Ecuador", population: 17640000, area: 283561, gdp: 107 },
  { id: "uy", name: "Uruguay", population: 3470000, area: 176215, gdp: 60 },
  { id: "py", name: "Paraguay", population: 7130000, area: 406752, gdp: 40 },
  { id: "bo", name: "Bolivia", population: 11670000, area: 1098581, gdp: 43 },
  
  // Rest of the world
  { id: "nz", name: "New Zealand", population: 5120000, area: 268838, gdp: 249 },
  { id: "is", name: "Iceland", population: 372000, area: 103000, gdp: 27 },
  { id: "mt", name: "Malta", population: 520000, area: 316, gdp: 17 },
  { id: "cy", name: "Cyprus", population: 1210000, area: 9251, gdp: 27 },
  { id: "lu", name: "Luxembourg", population: 630000, area: 2586, gdp: 73 },
  { id: "ad", name: "Andorra", population: 79000, area: 468, gdp: 3 },
  { id: "mc", name: "Monaco", population: 39000, area: 2, gdp: 7 },
  { id: "sm", name: "San Marino", population: 34000, area: 61, gdp: 2 },
  { id: "va", name: "Vatican City", population: 800, area: 0.44, gdp: 1 },
  { id: "li", name: "Liechtenstein", population: 38000, area: 160, gdp: 7 }
];
