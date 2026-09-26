export interface ThemedWordSet {
  theme: string;
  words: string[];
}
export const THEMED_WORD_SETS: ThemedWordSet[] = [
  {
    theme: 'Optics & Visuals',
    words: [
      'OPTIC', 'PICTURE', 'GRAPHICS', 'CINEMATIC', 'MICROSCOPE',
      'CAMERA', 'LENS', 'FOCUS', 'PRISM', 'REFLECT', 'SPECTRUM',
      'APERTURE', 'SHUTTER', 'VISION', 'MIRROR', 'LASER', 'PHOTON',
    ],
  },
  {
    theme: 'Tech & Computing',
    words: [
      'BYTE', 'LOGIC', 'SERVER', 'ROUTER', 'PROGRAM', 'NETWORK',
      'DATABASE', 'ALGORITHM', 'SOFTWARE', 'HARDWARE', 'TERMINAL',
      'BROWSER', 'PROCESS', 'COMPUTE', 'CIRCUIT', 'MEMORY', 'STORAGE',
      'COMPILER', 'DEBUGGER', 'PROCESSOR', 'INTERFACE', 'FRAMEWORK',
    ],
  },
  {
    theme: 'Space & Cosmos',
    words: [
      'STAR', 'MOON', 'ORBIT', 'COMET', 'PLANET', 'GALAXY', 'ECLIPSE',
      'NEBULA', 'GRAVITY', 'METEOR', 'TELESCOPE', 'ASTRONOMY', 'SATELLITE',
      'COSMOS', 'ROCKET', 'CLUSTER', 'SUPERNOVA', 'ASTEROID', 'SPACECRAFT',
    ],
  },
  {
    theme: 'Nature & Earth',
    words: [
      'RAIN', 'WIND', 'RIVER', 'FOREST', 'CANYON', 'GLACIER', 'VOLCANO',
      'MOUNTAIN', 'WEATHER', 'WILDLIFE', 'VALLEY', 'SUNSHINE', 'HORIZON',
      'OCEAN', 'DESERT', 'MEADOW', 'ISLAND', 'STREAM', 'CASCADE', 'MOUNTAINS',
    ],
  },
  {
    theme: 'Animals & Wildlife',
    words: [
      'WOLF', 'BEAR', 'TIGER', 'FALCON', 'DOLPHIN', 'CHEETAH', 'ELEPHANT',
      'PENGUIN', 'KANGAROO', 'OCTOPUS', 'GIRAFFE', 'LEOPARD', 'PELICAN',
      'PANTHER', 'BUFFALO', 'SALMON', 'WHALE', 'ANTELOPE', 'ALLIGATOR',
    ],
  },
  {
    theme: 'Science & Lab',
    words: [
      'ATOM', 'CELL', 'GENE', 'ENERGY', 'FUSION', 'MAGNET', 'OXYGEN',
      'COMPOUND', 'REACTION', 'QUANTUM', 'ELEMENT', 'NEUTRON', 'ORGANISM',
      'ELECTRON', 'MOLECULE', 'GENETICS', 'CATALYST', 'EXPERIMENT',
    ],
  },
];
export const GENERAL_WORDS_BY_LENGTH: Record<number, string[]> = {
  4: [
    'STAR', 'MOON', 'CODE', 'BYTE', 'RAIN', 'WIND', 'ATOM', 'CELL', 'GENE',
    'LENS', 'BEAR', 'WOLF', 'FISH', 'BIRD', 'DATA', 'NODE', 'FLOW', 'PATH',
    'WAVE', 'PEAK', 'ROCK', 'SOIL', 'LEAF', 'SEED', 'ROSE', 'PINE', 'SAND',
    'GOLD', 'IRON', 'LION', 'DEER', 'DUCK', 'FROG', 'HAWK', 'CRAB', 'SWAN',
    'TREE', 'WOOD', 'PARK', 'LAKE', 'POND', 'SURF', 'TIDE', 'FIRE', 'HEAT',
    'COAL', 'DUST', 'MIST', 'SNOW', 'HAIL', 'CALM', 'WILD', 'CAMP', 'HIKE',
    'SHIP', 'SAIL', 'DOCK', 'PORT', 'ROAD', 'LANE', 'GRID', 'CHIP', 'DISC',
    'DISK', 'WIRE', 'PLUG', 'HOST', 'LINK', 'PAGE', 'FORM', 'ICON', 'FONT',
    'MENU', 'VIEW', 'SITE', 'CHAT', 'TEAM', 'USER', 'PLAN', 'TASK', 'TEST',
    'LOCK', 'KEYS', 'TIME', 'DATE', 'YEAR', 'NOON', 'DAWN', 'DUSK',
  ],
  5: [
    'OPTIC', 'FOCUS', 'PRISM', 'LASER', 'LOGIC', 'ORBIT', 'COMET', 'RIVER',
    'OCEAN', 'EARTH', 'SOLAR', 'TIGER', 'WHALE', 'BRAIN', 'HEART', 'LIGHT',
    'SHINE', 'SPACE', 'CLOUD', 'STORM', 'STONE', 'PLANT', 'WATER', 'SOUND',
    'SHARK', 'EAGLE', 'OTTER', 'MOOSE', 'ZEBRA', 'HORSE', 'SHEEP', 'PANDA',
    'KOALA', 'FLORA', 'FAUNA', 'BEACH', 'CLIFF', 'OASIS', 'DUNES', 'CORAL',
    'REEFS', 'FIELD', 'GRASS', 'ROOTS', 'SEEDS', 'BLOOM', 'TREES', 'WOODS',
    'GROVE', 'FROST', 'STEAM', 'SPARK', 'FLASH', 'PULSE', 'RADAR', 'FIBER',
    'PIXEL', 'MODEM', 'ROUTE', 'DRIVE', 'STACK', 'ARRAY', 'QUEUE', 'GRAPH',
    'TABLE', 'QUERY', 'FETCH', 'PATCH', 'BUILD', 'SCALE', 'SPEED', 'POWER',
    'FORCE', 'SMART', 'ROBOT', 'CYBER', 'TRACK', 'GUIDE', 'ATLAS', 'GLOBE',
  ],
  6: [
    'CAMERA', 'MIRROR', 'SERVER', 'ROUTER', 'PLANET', 'GALAXY', 'NEBULA',
    'COSMOS', 'ROCKET', 'FOREST', 'CANYON', 'VALLEY', 'MEADOW', 'ISLAND',
    'STREAM', 'FALCON', 'SALMON', 'ENERGY', 'FUSION', 'MAGNET', 'OXYGEN',
    'VISION', 'PHOTON', 'PENCIL', 'CANVAS', 'DESIGN', 'SHADOW', 'VECTOR',
    'SYSTEM', 'MODULE', 'CODING', 'SCRIPT', 'BINARY', 'BUFFER', 'MEMORY',
    'CLIENT', 'ENGINE', 'THREAD', 'SOCKET', 'BRIDGE', 'PACKET', 'SIGNAL',
    'SENSOR', 'MATRIX', 'LAPTOP', 'SCREEN', 'DEVICE', 'VOLUME', 'SPRING',
    'AUTUMN', 'WINTER', 'SUMMER', 'BREEZE', 'CLOUDS', 'SUNSET', 'NATURE',
    'DESERT', 'JUNGLE', 'TROPIC', 'BRANCH', 'FLOWER', 'TIMBER', 'BEAVER',
    'MONKEY', 'BADGER', 'JAGUAR', 'PARROT', 'TURTLE', 'LIZARD',
  ],
  7: [
    'PICTURE', 'REFLECT', 'PROGRAM', 'NETWORK', 'STORAGE', 'CIRCUIT', 'PROCESS',
    'ECLIPSE', 'GRAVITY', 'GLACIER', 'VOLCANO', 'WEATHER', 'HORIZON', 'CASCADE',
    'DOLPHIN', 'CHEETAH', 'PENGUIN', 'LEOPARD', 'PELICAN', 'PANTHER', 'BUFFALO',
    'ELEMENT', 'NEUTRON', 'QUANTUM', 'CRYSTAL', 'DIAMOND', 'HARMONY', 'DESKTOP',
    'POINTER', 'CONSOLE', 'COMPUTE', 'BROWSER', 'GATEWAY', 'ROUTING', 'ADAPTER',
    'COMPILE', 'RUNTIME', 'PACKAGE', 'ARCHIVE', 'SCANNER', 'MACHINE', 'DIGITAL',
    'VIRTUAL', 'DYNAMIC', 'NATURAL', 'RAINBOW', 'TSUNAMI', 'MONSOON', 'TORNADO',
    'CURRENT', 'ICEBERG', 'HABITAT', 'SPARROW', 'GIRAFFE', 'GORILLA', 'OSTRICH',
    'HAMSTER',
  ],
  8: [
    'GRAPHICS', 'APERTURE', 'DATABASE', 'SOFTWARE', 'HARDWARE', 'TERMINAL',
    'ASTEROID', 'MOUNTAIN', 'WILDLIFE', 'SUNSHINE', 'ELEPHANT', 'KANGAROO',
    'COMPOUND', 'ORGANISM', 'ELECTRON', 'MOLECULE', 'GENETICS', 'CATALYST',
    'SPECTRUM', 'UNIVERSE', 'SYMPHONY', 'HORIZONS', 'ILLUSION', 'CREATION',
    'PLATFORM', 'INTERNET', 'FIREWALL', 'PROTOCOL', 'WIRELESS', 'CELLULAR',
    'FIRMWARE', 'BACKBONE', 'SYMBOLIC', 'FUNCTION', 'VARIABLE', 'COMPILER',
    'DEBUGGER', 'FORESTRY', 'WOODLAND', 'SEASHORE', 'BLIZZARD', 'RAINDROP',
    'OVERCAST', 'WILDWOOD', 'ANTELOPE', 'HEDGEHOG', 'REINDEER', 'PLATYPUS',
    'SQUIRREL', 'KEYBOARD', 'FLAMINGO', 'SUNLIGHT',
  ],
  9: [
    'CINEMATIC', 'ALGORITHM', 'TELESCOPE', 'ASTRONOMY', 'SATELLITE', 'SUPERNOVA',
    'LANDSCAPE', 'RESONANCE', 'EXPLORING', 'BIOSPHERE', 'ADVENTURE', 'STRUCTURE',
    'EVOLUTION', 'DISCOVERY', 'BRILLIANT', 'KNOWLEDGE', 'MOUNTAINS', 'COMPUTING',
    'PROCESSOR', 'INTERFACE', 'FRAMEWORK', 'COMPONENT', 'DEVELOPER', 'EXECUTION',
    'BANDWIDTH', 'ANIMATION', 'RENDERING', 'DIRECTORY', 'OPERATION', 'MAINFRAME',
    'WATERFALL', 'EVERGREEN', 'LIGHTNING', 'ALLIGATOR', 'CHAMELEON', 'PORCUPINE',
    'CROCODILE',
  ],
  10: [
    'MICROSCOPE', 'REFLECTING', 'CONNECTION', 'INNOVATION', 'ATMOSPHERE',
    'NAVIGATION', 'GENERATION', 'EXPEDITION', 'EXPERIMENT', 'LABORATORY',
    'POPULATION', 'TECHNOLOGY', 'ILLUMINATE', 'PROJECTION', 'CYBERSPACE',
    'CONTROLLER', 'PROGRAMMER', 'SIMULATION', 'ENCRYPTION', 'PRODUCTION',
    'BIOLOGICAL', 'SCIENTIFIC', 'GEOPHYSICS', 'ASTRONOMER', 'SPACECRAFT',
    'WILDERNESS', 'WATERFALLS', 'LANDSCAPES', 'RAINSTORMS', 'RAINFOREST',
    'CLEARWATER',
  ],
  11: [
    'PHOTOGRAPHY', 'CALCULATION', 'EXPLORATION', 'OBSERVATION', 'DEVELOPMENT',
    'MEASUREMENT', 'INTERACTION', 'INTEGRATION', 'CONSTELLATE', 'SPECTACULAR',
    'OBSERVATORY', 'PROGRAMMING', 'APPLICATION', 'ENVIRONMENT', 'ACCELERATOR',
    'TEMPERATURE', 'WORKSTATION', 'ELECTRONICS', 'INTERFACING', 'BIOPHYSICAL',
    'MOTHERBOARD',
  ],
  12: [
    'ILLUMINATION', 'ACCELERATION', 'BIODIVERSITY', 'TECHNOLOGIES', 'ASTROPHYSICS',
    'EXPERIMENTAL', 'APPRECIATION', 'ARCHITECTURE', 'TRANSMISSION', 'SUPERCLUSTER',
    'CRYPTOGRAPHY', 'COMPILATIONS', 'SUPERCONDUCT',
  ],
};
const ALL_WORDS_ARRAY: string[] = [
  ...Object.values(GENERAL_WORDS_BY_LENGTH).flat(),
  ...THEMED_WORD_SETS.flatMap((s) => s.words),
];
export const VALID_WORDS_SET = new Set<string>(
  ALL_WORDS_ARRAY.map((w) => w.toUpperCase())
);
export const getWordsOfLength = (
  length: number,
  theme?: string,
  excludeWords?: Set<string>
): string[] => {
  if (theme) {
    const set = THEMED_WORD_SETS.find(
      (s) => s.theme.toLowerCase() === theme.toLowerCase()
    );
    if (set) {
      let filtered = set.words.filter((w) => w.length === length);
      if (excludeWords) {
        filtered = filtered.filter((w) => !excludeWords.has(w));
      }
      if (filtered.length > 0) return filtered;
    }
  }
  const pool = GENERAL_WORDS_BY_LENGTH[length] ?? [];
  const valid = pool.filter((w) => w.length === length);
  if (excludeWords && excludeWords.size > 0) {
    const withoutExcluded = valid.filter((w) => !excludeWords.has(w));
    if (withoutExcluded.length > 0) return withoutExcluded;
  }
  return valid;
};
