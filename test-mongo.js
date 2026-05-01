const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  const uri = process.env.MONGO_URL;
  if (!uri) {
    console.error("❌ ERREUR : MONGO_URL n'est pas défini dans .env.local");
    process.exit(1);
  }

  console.log("Tentative de connexion à MongoDB Atlas...");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("✅ SUCCÈS : Connexion à MongoDB Atlas réussie ! La configuration est parfaite.");
  } catch (error) {
    console.error("❌ ERREUR DE CONNEXION :", error.message);
    console.log("\nVérifie les points suivants sur Atlas :");
    console.log("1. Le mot de passe de l'utilisateur est-il bien correct ?");
    console.log("2. Dans 'Network Access', as-tu bien ajouté l'IP '0.0.0.0/0' ?");
  } finally {
    await client.close();
  }
}

testConnection();
