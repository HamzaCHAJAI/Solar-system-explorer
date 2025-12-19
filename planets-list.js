// Configuration des planètes du système solaire
const solarSystemPlanets = [
  { 
    name: 'Soleil', 
    type: 'étoile',
    size: 5, 
    distance: 0, 
    temperature: 5500,
    atmosphere: [],
    hasWater: false,
    color: 0xffff00,
    description: 'L\'étoile centrale de notre système solaire.'
  },
  { 
    name: 'Mercure', 
    type: 'rocheuse',
    size: 0.4, 
    distance: 8, 
    temperature: 427,
    atmosphere: [],
    hasWater: false,
    color: 0x8c7853,
    description: 'La planète la plus proche du soleil. Elle tourne autour du soleil plus rapidement que toutes les autres planètes.'
  },
  { 
    name: 'Vénus', 
    type: 'rocheuse',
    size: 0.6, 
    distance: 11, 
    temperature: 462,
    atmosphere: ['co2'],
    hasWater: false,
    color: 0xffc649,
    description: 'Nommée d\'après la déesse romaine de l\'amour et de la beauté. C\'est la planète la plus chaude du système solaire.'
  },
  { 
    name: 'Terre', 
    type: 'rocheuse',
    size: 0.6, 
    distance: 14, 
    temperature: 15,
    atmosphere: ['oxygene', 'azote'],
    hasWater: true,
    color: 0x6b93d6,
    description: 'Notre planète d\'origine. C\'est la seule planète connue pour avoir une atmosphère contenant de l\'oxygène libre et de l\'eau liquide.'
  },
  { 
    name: 'Mars', 
    type: 'rocheuse',
    size: 0.5, 
    distance: 18, 
    temperature: -65,
    atmosphere: ['co2'],
    hasWater: false,
    color: 0xc1440e,
    description: 'La quatrième planète du soleil et la deuxième plus petite planète du système solaire. Surnommée la "planète rouge".'
  },
  { 
    name: 'Jupiter', 
    type: 'gazeuse',
    size: 1.2, 
    distance: 24, 
    temperature: -110,
    atmosphere: ['hydrogene', 'helium'],
    hasWater: false,
    color: 0xd8ca9d,
    description: 'La plus grande planète du système solaire. Nommée d\'après le roi des dieux dans la mythologie romaine.'
  },
  { 
    name: 'Saturne', 
    type: 'gazeuse',
    size: 1.0, 
    distance: 30, 
    temperature: -140,
    atmosphere: ['hydrogene', 'helium'],
    hasWater: false,
    color: 0xfad5a5,
    description: 'La sixième planète du soleil et la deuxième plus grande planète du système solaire. Connue pour ses magnifiques anneaux.'
  },
  { 
    name: 'Uranus', 
    type: 'gazeuse',
    size: 0.8, 
    distance: 36, 
    temperature: -195,
    atmosphere: ['hydrogene', 'helium', 'methane'],
    hasWater: false,
    color: 0x4fd0e7,
    description: 'La première planète découverte par les scientifiques. Notable pour son inclinaison dramatique.'
  },
  { 
    name: 'Neptune', 
    type: 'gazeuse',
    size: 0.8, 
    distance: 42, 
    temperature: -200,
    atmosphere: ['hydrogene', 'helium', 'methane'],
    hasWater: false,
    color: 0x4b70dd,
    description: 'La huitième planète du soleil. La première planète dont l\'existence a été prédite par des calculs mathématiques.'
  }
];

// Planètes personnalisées (chargées depuis l'API backend / base SQLite)
let customPlanets = [];
let currentFilter = 'solar';

// Charger les planètes personnalisées depuis l'API (base SQLite)
async function loadCustomPlanets() {
  try {
    const response = await fetch('/api/planets');
    if (!response.ok) {
      throw new Error('Erreur HTTP ' + response.status);
    }
    const data = await response.json();
    customPlanets = data;
    displayPlanets();
  } catch (error) {
    console.error('Erreur lors du chargement des planètes personnalisées:', error);
    const container = document.getElementById('planetsContainer');
    if (container) {
      container.innerHTML = '<div class="no-planets">Erreur lors du chargement des planètes ajoutées.</div>';
    }
  }
}

// Obtenir le nom du type en français
function getTypeName(type) {
  const types = {
    'rocheuse': 'Rocheuse',
    'gazeuse': 'Gazeuse',
    'oceanique': 'Océanique',
    'étoile': 'Étoile'
  };
  return types[type] || type;
}

// Obtenir la couleur hex depuis la couleur Three.js
function getColorHex(color) {
  if (typeof color === 'number') {
    return '#' + color.toString(16).padStart(6, '0');
  }
  return color;
}

// Obtenir la couleur selon le type ou utiliser la couleur de la planète
function getPlanetColor(planet) {
  if (planet.color) {
    return getColorHex(planet.color);
  }
  const colors = {
    'rocheuse': 0x8c7853,
    'gazeuse': 0xd8ca9d,
    'oceanique': 0x4b70dd,
    'étoile': 0xffff00
  };
  const colorValue = colors[planet.type] || 0x888888;
  return getColorHex(colorValue);
}

// Obtenir la couleur Three.js pour la sphère
function getPlanetColorThree(planet) {
  if (planet.color) {
    return planet.color;
  }
  const colors = {
    'rocheuse': 0x8c7853,
    'gazeuse': 0xd8ca9d,
    'oceanique': 0x4b70dd,
    'étoile': 0xffff00
  };
  return colors[planet.type] || 0x888888;
}

// Créer une sphère 3D pour une planète
function createPlanetSphere(planet, containerId) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  
  const size = 120;
  renderer.setSize(size, size);
  renderer.setClearColor(0x000000, 0);
  
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.appendChild(renderer.domElement);
  
  const planetColor = getPlanetColorThree(planet);
  const geometry = new THREE.SphereGeometry(1, 32, 32);
  const material = planet.type === 'étoile' 
    ? new THREE.MeshBasicMaterial({ color: planetColor, emissive: planetColor, emissiveIntensity: 0.5 })
    : new THREE.MeshPhongMaterial({ color: planetColor });
  
  const sphere = new THREE.Mesh(geometry, material);
  scene.add(sphere);
  
  // Ajouter une lumière pour les planètes non-étoiles
  if (planet.type !== 'étoile') {
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
  }
  
  camera.position.z = 3;
  
  // Animation de rotation
  function animate() {
    requestAnimationFrame(animate);
    sphere.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();
  
  return renderer.domElement;
}

// Créer une carte de planète
function createPlanetCard(planet, isCustom = false) {
  const typeName = getTypeName(planet.type);
  const planetColor = getPlanetColor(planet);
  
  // Pour les planètes personnalisées, s'assurer qu'elles ont une couleur
  if (isCustom && !planet.color) {
    const typeColors = {
      'rocheuse': 0x8c7853,
      'gazeuse': 0xd8ca9d,
      'oceanique': 0x4b70dd
    };
    planet.color = typeColors[planet.type] || 0x888888;
  }
  
  const card = document.createElement('div');
  card.className = `planet-card-screen`;
  const cardId = `planet-card-${planet.name.replace(/\s+/g, '-')}-${Date.now()}-${Math.random()}`;
  card.id = cardId;
  
  card.innerHTML = `
    <div class="planet-sphere-container" id="sphere-${cardId}"></div>
    <div class="planet-card-info">
      <div class="planet-name">
        <span class="planet-dot" style="background-color: ${planetColor};"></span>
        <span class="planet-name-text" style="color: ${planetColor};">${planet.name}</span>
      </div>
      <div class="planet-characteristics">
        <div class="characteristic-item">
          <span class="char-label">Type:</span>
          <span class="char-value">${typeName}</span>
        </div>
        <div class="characteristic-item">
          <span class="char-label">Rayon:</span>
          <span class="char-value">${planet.size} unités</span>
        </div>
        <div class="characteristic-item">
          <span class="char-label">Distance:</span>
          <span class="char-value">${planet.distance} unités</span>
        </div>
      </div>
    </div>
  `;
  
  // Créer la sphère 3D après l'insertion dans le DOM
  setTimeout(() => {
    createPlanetSphere(planet, `sphere-${cardId}`);
  }, 100);
  
  return card;
}

// Afficher les planètes
function displayPlanets() {
  const container = document.getElementById('planetsContainer');
  const pageTitle = document.getElementById('pageTitle');
  container.innerHTML = '';

  let planetsToShow = [];

  if (currentFilter === 'solar') {
    planetsToShow = solarSystemPlanets.map(p => ({ ...p, isCustom: false }));
    pageTitle.textContent = 'Planètes du Système Solaire';
  } else if (currentFilter === 'custom') {
    planetsToShow = customPlanets.map(p => ({ ...p, isCustom: true }));
    pageTitle.textContent = 'Planètes ajoutées';
  }

  if (planetsToShow.length === 0) {
    if (currentFilter === 'custom') {
      container.innerHTML = '<div class="no-planets">Aucune planète ajoutée pour le moment. Allez sur la page 3D pour ajouter des planètes personnalisées.</div>';
    } else {
      container.innerHTML = '<div class="no-planets">Aucune planète à afficher</div>';
    }
    return;
  }

  planetsToShow.forEach(planet => {
    const card = createPlanetCard(planet, planet.isCustom);
    container.appendChild(card);
  });
}

// Initialiser la page
async function init() {
  try {
    // Afficher les planètes du système solaire par défaut
    displayPlanets();
    
    // Gestion des boutons de navigation
    const btnSolar = document.getElementById('btnSolar');
    const btnCustom = document.getElementById('btnCustom');
    
    btnSolar.addEventListener('click', () => {
      currentFilter = 'solar';
      btnSolar.classList.add('active');
      btnCustom.classList.remove('active');
      displayPlanets();
    });
    
    btnCustom.addEventListener('click', () => {
      currentFilter = 'custom';
      btnCustom.classList.add('active');
      btnSolar.classList.remove('active');
      // Recharger les planètes personnalisées depuis la base SQL
      loadCustomPlanets();
    });
    
    // Masquer le loading
    setTimeout(() => {
      document.getElementById('loading').style.display = 'none';
    }, 500);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
    document.getElementById('loading').textContent = 'Erreur lors du chargement des planètes';
  }
}

// Démarrer l'application
init();

