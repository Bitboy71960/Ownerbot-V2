const { REST, Routes } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

async function cleanupAllCommands() {
  try {
    console.log('=================');
    console.log('NETTOYAGE COMPLET DES COMMANDES');
    console.log('=================');
    
    const rest = new REST({ version: '10' }).setToken(TOKEN);
    
    // Supprimer toutes les commandes globales
    console.log('Suppression des commandes globales...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: [] }
    );
    console.log('Commandes globales supprimées avec succès');
    
    // Supprimer les commandes spécifiques au serveur
    if (GUILD_ID) {
      console.log(`Suppression des commandes pour le serveur ${GUILD_ID}...`);
      await rest.put(
        Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
        { body: [] }
      );
      console.log(`Commandes du serveur ${GUILD_ID} supprimées avec succès`);
    }
    
    console.log('=================');
    console.log('NETTOYAGE TERMINÉ');
    console.log('Vous pouvez maintenant redémarrer votre bot');
    console.log('=================');
  } catch (error) {
    console.error('Erreur lors du nettoyage des commandes:', error);
  }
}

cleanupAllCommands(); 