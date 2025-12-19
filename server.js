const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const mysql = require('mysql2/promise');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialiser la connexion MySQL (pour utilisation avec phpMyAdmin)
// Pensez à adapter ces valeurs à votre configuration locale MySQL.
// Par exemple sous XAMPP : host: 'localhost', user: 'root', password: '', database: 'solar_system'
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'solar_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDatabase() {
  try {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS planets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pseudo VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        size DOUBLE NOT NULL,
        distance DOUBLE NOT NULL,
        temperature DOUBLE NOT NULL,
        atmosphere TEXT,
        hasWater TINYINT(1) DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(createTableSQL);
    console.log('Table planets (MySQL) créée ou déjà existante.');
  } catch (err) {
    console.error('Erreur lors de l\'initialisation de la base MySQL:', err.message);
  }
}

// Lancer l'initialisation au démarrage du serveur
initDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Routes pour servir les pages HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/3d', (req, res) => {
  res.sendFile(path.join(__dirname, 'solar3d.html'));
});

// Route pour l'API NASA - Astronomy Picture of the Day
app.get('/api/nasa/apod', async (req, res) => {
  try {
    const response = await axios.get('https://api.nasa.gov/planetary/apod', {
      params: {
        api_key: 'U06TwcwnDf7iUfHKWbYk977bRzewpbgtKaHlaytJ', 
        ...req.query
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des données NASA' });
  }
});

// Route pour les images de la NASA
app.get('/api/nasa/images', async (req, res) => {
  try {
    const { q } = req.query;
    const response = await axios.get('https://images-api.nasa.gov/search', {
      params: {
        q: q || 'solar system',
        media_type: 'image'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des images NASA' });
  }
});

// Route pour obtenir des informations sur une planète
app.get('/api/nasa/planet/:planetName', async (req, res) => {
  try {
    const { planetName } = req.params;
    const response = await axios.get('https://images-api.nasa.gov/search', {
      params: {
        q: planetName,
        media_type: 'image'
      }
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des données de la planète' });
  }
});

// Route pour sauvegarder une planète personnalisée
app.post('/api/planets', async (req, res) => {
  const { pseudo, planetName, type, size, distance, temperature, atmosphere, hasWater } = req.body;

  // Valider les données
  if (!pseudo || !planetName || !type || !size || !distance || !temperature) {
    return res.status(400).json({ error: 'Tous les champs obligatoires doivent être remplis' });
  }

  // Convertir l'atmosphère en chaîne JSON si c'est un tableau
  const atmosphereStr = Array.isArray(atmosphere) ? JSON.stringify(atmosphere) : atmosphere || '[]';

  const sql = `INSERT INTO planets (pseudo, name, type, size, distance, temperature, atmosphere, hasWater) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

  try {
    const [result] = await pool.query(sql, [
      pseudo,
      planetName,
      type,
      size,
      distance,
      temperature,
      atmosphereStr,
      hasWater ? 1 : 0
    ]);

    res.json({
      success: true,
      message: 'Planète sauvegardée avec succès',
      id: result.insertId
    });
  } catch (err) {
    console.error('Erreur lors de l\'insertion MySQL:', err.message);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde de la planète' });
  }
});

// Route pour récupérer toutes les planètes personnalisées
app.get('/api/planets', async (req, res) => {
  const sql = `SELECT * FROM planets ORDER BY createdAt DESC`;

  try {
    const [rows] = await pool.query(sql);

    // Parser l'atmosphère si c'est une chaîne JSON
    const planets = rows.map(row => ({
      ...row,
      atmosphere: typeof row.atmosphere === 'string' ? JSON.parse(row.atmosphere) : row.atmosphere,
      hasWater: row.hasWater === 1
    }));

    res.json(planets);
  } catch (err) {
    console.error('Erreur lors de la récupération MySQL:', err.message);
    res.status(500).json({ error: 'Erreur lors de la récupération des planètes' });
  }
});

// Route pour supprimer une planète
app.delete('/api/planets/:id', async (req, res) => {
  const { id } = req.params;
  const sql = `DELETE FROM planets WHERE id = ?`;

  try {
    await pool.query(sql, [id]);
    res.json({ success: true, message: 'Planète supprimée avec succès' });
  } catch (err) {
    console.error('Erreur lors de la suppression MySQL:', err.message);
    res.status(500).json({ error: 'Erreur lors de la suppression de la planète' });
  }
});

// Fermer proprement le pool MySQL lors de l'arrêt du serveur
process.on('SIGINT', async () => {
  try {
    await pool.end();
    console.log('Pool MySQL fermé.');
  } catch (err) {
    console.error('Erreur lors de la fermeture du pool MySQL:', err.message);
  }
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
  console.log(`Page principale: http://localhost:${PORT}`);
  console.log(`Page 3D: http://localhost:${PORT}/3d`);
});

