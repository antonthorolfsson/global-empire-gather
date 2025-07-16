// SVG Map Countries (uppercase ISO codes)
const svgCountries = [
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ', 
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BN', 'BO', 'BM', 'BQ', 'BR', 
  'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 
  'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 
  'DZ', 'EC', 'EG', 'EE', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 
  'GB', 'GE', 'GD', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GO', 'GP', 'GQ', 'GR', 'GS', 
  'GT', 'GU', 'GW', 'GY', 'HK', 'HM', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 
  'IO', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'JU', 'KE', 'KG', 'KH', 'KI', 'KM', 
  'KN', 'KP', 'KR', 'XK', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 
  'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'MG', 'ME', 'MF', 'MH', 'MK', 'ML', 'MO', 'MM', 'MN', 
  'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NF', 
  'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 
  'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 
  'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 
  'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 
  'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'UM', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 
  'VG', 'VI', 'VN', 'VU', 'WF', 'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZW'
];

// Game Countries (lowercase codes)
const gameCountries = [
  'us', 'cn', 'jp', 'de', 'in', 'gb', 'fr', 'it', 'br', 'ca', 'ru', 'kr', 'tw', 'au', 'es', 
  'mx', 'id', 'nl', 'ch', 'tr', 'be', 'ie', 'at', 'il', 'no', 'se', 'pl', 'dk', 'fi', 'pt', 
  'gr', 'cz', 'ro', 'hu', 'bg', 'hr', 'sk', 'si', 'al', 'rs', 'lt', 'lv', 'ee', 'sa', 'ae', 
  'ir', 'iq', 'ua', 'eg', 'za', 'ng', 'ma', 'ke', 'gh', 'et', 'tn', 'ly', 'dz', 'th', 'sg', 
  'my', 'ph', 'vn', 'bd', 'pk', 'lk', 'np', 'mm', 'kh', 'la', 'kz', 'ar', 'cl', 'pe', 'co', 
  've', 'ec', 'uy', 'py', 'bo', 'nz', 'is', 'mt', 'cy', 'lu', 'ad', 'mc', 'sm', 'va', 'li', 
  'lr', 'tg', 'kp', 'ao', 'tz', 'ug', 'cm', 'sd', 'cd', 'ci', 'sn', 'ml', 'bf', 'ne', 'td', 
  'zm', 'zw', 'bw', 'na'
];

// Convert game countries to uppercase for comparison
const gameCountriesUpper = gameCountries.map(c => c.toUpperCase());

// Find countries in SVG but not in game
const missingFromGame = svgCountries.filter(code => !gameCountriesUpper.includes(code));

// Find countries in game but not in SVG
const missingFromSvg = gameCountriesUpper.filter(code => !svgCountries.includes(code));

console.log('=== MISSING FROM GAME (Countries in SVG but not in gameCountries.ts) ===');
console.log('Count:', missingFromGame.length);
console.log('Countries:', missingFromGame.sort());

console.log('\n=== MISSING FROM SVG (Countries in gameCountries.ts but not in SVG) ===');
console.log('Count:', missingFromSvg.length);
console.log('Countries:', missingFromSvg.sort());

console.log('\n=== SUMMARY ===');
console.log('SVG Countries:', svgCountries.length);
console.log('Game Countries:', gameCountries.length);
console.log('Missing from Game:', missingFromGame.length);
console.log('Missing from SVG:', missingFromSvg.length);