/**
 * Ace Attorney Pairing Generator - Main Logic
 * Loads character data and handles pairing generation
 */

// Pairing mode constants
const MODES = {
  NORMAL: "hetero",
  MM: "homo-male",
  FF: "homo-female"
};

let characters = [];


/**
 * Load characters from JSON file
 */
async function loadCharacters() {
  try {
    const response = await fetch('./assets/characters.json');
    if (!response.ok) throw new Error('Failed to load characters');
    characters = await response.json();
    console.log(`Loaded ${characters.length} characters`);
  } catch (error) {
    console.error('Error loading characters:', error);
  }
}

/**
 * Get all characters filtered by tags
 * @param {string} tag - The tag to filter by (e.g., "pw1", "game", "female")
 * @returns {array} Filtered character array
 */
function getCharsByTag(tag = null) {
  if(tag === null) return characters;
  return characters.filter(char => char.tags.includes(tag));
}

/**
 * Get random character from array
 * @param {array} charArray - Array of characters
 * @returns {object} Random character object
 */
function getRandomChar(charArray) {
  return charArray[Math.floor(Math.random() * charArray.length)];
}

/**
 * Get a pairing from a subgroup
 * @param {string} subgroup - Subgroup name (e.g., "pw1", "game", "all")
 * @param {string} mode - Pairing mode: "hetero", "homo-male", or "homo-female"
 *                        Default: "hetero"
 * @returns {object} Pairing object with character(s) depending on mode
 *                   hetero: { male, female }
 *                   homo-male: { male1, male2 }
 *                   homo-female: { female1, female2 }
 */
function getPairing(subgroup, mode = MODES.NORMAL) {
  // Convert "all" to null to get full character list
  const tag = subgroup === "all" ? null : subgroup;
  const subgroupChars = getCharsByTag(tag);
  
  if (mode === MODES.NORMAL) {
    const males = subgroupChars.filter(c => c.gender === "male");
    const females = subgroupChars.filter(c => c.gender === "female");
    
    if (males.length === 0 || females.length === 0) {
      console.warn(`No characters found for subgroup: ${subgroup}`);
      return null;
    }
    
    let male = getRandomChar(males);
    let female;
    
    // For "all" or "game" subgroups, avoid pairing different versions of the same character
    if (subgroup === "all" || subgroup === "game") {
      do {
        female = getRandomChar(females);
      } while (female.characterId === male.characterId);
    } else {
      female = getRandomChar(females);
    }
    
    return {
      male,
      female
    };
  }
      
  if (mode === MODES.MM) {
    const males = subgroupChars.filter(c => c.gender === "male");
    
    if (males.length < 2) {
      console.warn(`Not enough males for homo pairing in subgroup: ${subgroup}`);
      return null;
    }
    
    let male1 = getRandomChar(males);
    let male2;
    
    // Ensure male2 is different from male1 (by image)
    // Also avoid different versions of the same character for "all" and "game" subgroups
    do {
      male2 = getRandomChar(males);
    } while ((male2.image === male1.image || 
             ((subgroup === "all" || subgroup === "game") &&
             male2.characterId === male1.characterId)));
    
    return { male1, male2 };
  }
  
  if (mode === MODES.FF) {
    const females = subgroupChars.filter(c => c.gender === "female");
    
    if (females.length < 2) {
      console.warn(`Not enough females for same-sex pairing in subgroup: ${subgroup}`);
      return null;
    }
    
    let female1 = getRandomChar(females);
    let female2;
        
    // Ensure female2 is different from female1 (by image)
    // Also avoid different versions of the same character for "all" and "game" subgroups
    do {
      female2 = getRandomChar(females);
    } while ((female2.image === female1.image || 
             ((subgroup === "all" || subgroup === "game") && 
             female2.characterId === female1.characterId)));
    
    return { female1, female2 };
  }  
  console.warn(`Invalid pairing mode: ${mode}`);
  return null;
}

/**
 * Generate and display a pairing
 */
function generatePairing() {
  // Parse the combined selector value (format: "subgroup-mode")
  const selector = document.getElementById("pairingSelector").value;
  const [subgroup, mode] = selector.split('-');
  const actualMode = mode === 'normal' ? MODES.NORMAL : 
                     (mode === 'MM' ? MODES.MM : 
                      (mode === 'FF' ? MODES.FF : mode));
  
  // Parse composite mode values (e.g., "homo-male" is stored as "homo" and "male")
  let finalMode = mode;
  if (selector.includes('MM')) {
    finalMode = MODES.MM;
  } else if (selector.includes('FF')) {
    finalMode = MODES.FF;
  } else {
    finalMode = MODES.NORMAL;
  }

  const errorDiv = document.getElementById("error");
  const pairingDiv = document.getElementById("pairing");

  errorDiv.innerHTML = "";
  pairingDiv.style.display = "none";

  const pairing = getPairing(subgroup, finalMode);

  if (!pairing) {
    errorDiv.className = "error";
    errorDiv.innerHTML = `❌ No valid pairing available for this selection.`;
    return;
  }
  errorDiv.style.display = "none";


  // Map characters to display based on pairing mode
  let char1, char2;
  
  if (finalMode === MODES.NORMAL) {
    char1 = pairing.male;
    char2 = pairing.female;
  } else if (finalMode === MODES.MM) {
    char1 = pairing.male1;
    char2 = pairing.male2;
  } else if (finalMode === MODES.FF) {
    char1 = pairing.female1;
    char2 = pairing.female2;
  }

  // Update DOM with pairing
  document.getElementById("char1Name").textContent = char1.name;
  document.getElementById("char1Image").src = `./characters/${char1.image}.png`;
  document.getElementById("char1Image").alt = char1.name;

  document.getElementById("char2Name").textContent = char2.name;
  document.getElementById("char2Image").src = `./characters/${char2.image}.png`;
  document.getElementById("char2Image").alt = char2.name;

  pairingDiv.style.display = "grid";
}

// Expose PAIRING_MODES globally for HTML access
window.PAIRING_MODES = MODES;

// Load characters and generate initial pairing on page load
window.addEventListener("load", async () => {
  await loadCharacters();
  generatePairing();
});
