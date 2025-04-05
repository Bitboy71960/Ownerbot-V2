# README - Bot Discord Multifonction

Ce bot Discord est une solution complète pour gérer votre serveur avec plusieurs fonctionnalités essentielles : système de tickets, vérification par captcha, logs d'activité, gestion des invitations, assistant IA, et bien plus encore.

## 🌟 Fonctionnalités

### Système de Tickets
- Menu déroulant avec 5 options (Support, Boutique, Lot, Réclamation, Partenariat)
- Création automatique de canaux privés dans une catégorie dédiée
- Bouton pour fermer les tickets

### Système de Vérification
- Vérification par captcha textuel
- Attribution automatique d'un rôle après vérification
- Protection contre les bots et les raids

### Logs et Surveillance
- Logs d'activité du serveur (messages, rôles, membres)
- Suivi des invitations (qui a invité qui)
- Statistiques d'invitations par membre

### Assistant IA
- Canal dédié où l'IA répond automatiquement
- Utilisation de l'API OpenRouter pour des réponses intelligentes
- Personnalisation possible du modèle d'IA
- Option de canal jailbreak pour des réponses sans restrictions
- Historique de conversation stocké avec MongoDB

### Gestion du Serveur
- Création d'embeds personnalisés
- Commande de nettoyage des messages
- Système de sauvegarde et restauration du serveur

## 📋 Prérequis

- [Node.js](https://nodejs.org/) (version 16.9.0 ou supérieure)
- Un compte [Discord Developer](https://discord.com/developers/applications)
- Un compte [OpenRouter](https://openrouter.ai/) pour la fonctionnalité d'IA (optionnel)
- [MongoDB](https://www.mongodb.com/) (local ou Atlas) pour l'historique des conversations
- Un service d'hébergement (Render, Railway, VPS, etc.)

## 🚀 Installation

1. **Clonez ce dépôt**
   ```
   git clone <url-du-dépôt>
   cd discord-bot
   ```

2. **Installez les dépendances**
   ```
   npm install
   ```

3. **Configurez le fichier .env**
   
   Créez un fichier `.env` à la racine du projet avec le contenu suivant :
   ```
   TOKEN=votre_token_discord
   CLIENT_ID=id_de_votre_application
   OPENROUTER_API_KEY=votre_clé_api_openrouter (optionnel)
   MONGODB_URI=votre_uri_mongodb (optionnel, par défaut: mongodb://localhost:27017)
   ```
   
   Pour obtenir un token Discord :
   - Rendez-vous sur [Discord Developer Portal](https://discord.com/developers/applications)
   - Créez une nouvelle application
   - Allez dans l'onglet "Bot"
   - Cliquez sur "Reset Token" pour obtenir votre token
   - Activez les "Privileged Gateway Intents" (PRESENCE INTENT, SERVER MEMBERS INTENT, MESSAGE CONTENT INTENT)
   
   Pour MongoDB :
   - Utilisez une installation locale ou créez un compte sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Créez un cluster et obtenez l'URI de connexion

4. **Ajoutez une image pour l'embed des tickets**
   
   Placez une image nommée `ticket.png` dans le dossier racine du projet.

5. **Démarrez le bot**
   ```
   npm start
   ```

## 🔧 Configuration pour un hébergement permanent

### Utilisation de PM2 (recommandé)

1. **Installez PM2 globalement**
   ```
   npm install -g pm2
   ```

2. **Démarrez le bot avec PM2**
   ```
   pm2 start ecosystem.config.js
   ```

3. **Configurez le démarrage automatique**
   ```
   pm2 startup
   pm2 save
   ```

### Déploiement sur Render

1. **Créez un compte Render** si vous n'en avez pas déjà un.

2. **Depuis le tableau de bord Render**, cliquez sur "New" puis sélectionnez "Web Service".

3. **Connectez votre dépôt GitHub** où se trouve votre code.

4. **Configurez votre service** :
   - **Name**: discord-bot (ou le nom de votre choix)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`

5. **Dans la section "Environment Variables"**, ajoutez :
   - **KEY**: TOKEN
   - **VALUE**: Votre token Discord
   - **KEY**: CLIENT_ID
   - **VALUE**: ID de votre application Discord
   - **KEY**: OPENROUTER_API_KEY
   - **VALUE**: Votre clé API OpenRouter (optionnel)
   - **KEY**: PORT
   - **VALUE**: 10000

6. **Cliquez sur "Create Web Service"** pour déployer votre bot.

## 💻 Utilisation

### Inviter le bot sur votre serveur

1. Rendez-vous sur le [Discord Developer Portal](https://discord.com/developers/applications)
2. Sélectionnez votre application
3. Allez dans l'onglet "OAuth2" > "URL Generator"
4. Sélectionnez les scopes "bot" et "applications.commands"
5. Sélectionnez les permissions nécessaires (Administrator recommandé)
6. Copiez l'URL générée et ouvrez-la dans votre navigateur
7. Sélectionnez le serveur où vous souhaitez ajouter le bot

### Commandes Administrateur

- `/createticket` - Crée un embed pour le système de tickets
- `/setupverification` - Configure le système de vérification par captcha
- `/setupai` - Configure le canal pour l'assistant IA
- `/setupjailbreakai` - Configure le canal pour l'assistant IA jailbreak
- `/createembed` - Crée un embed personnalisé
- `/setuplogs` - Configure le canal pour les logs du serveur
- `/setupinvitelogs` - Configure le canal pour les logs d'invitations
- `/backup create` - Crée une sauvegarde du serveur
- `/backup list` - Affiche la liste des sauvegardes disponibles
- `/backup restore` - Restaure une sauvegarde
- `/clear` - Supprime un nombre spécifié de messages

### Commandes Utilisateur

- `/invites` - Affiche le nombre d'invitations d'un membre

## 🔍 Dépannage

- **Le bot ne répond pas** : Vérifiez que le token est correct et que les intents sont activés.
- **Les commandes slash n'apparaissent pas** : Assurez-vous que le CLIENT_ID est correct et que le bot a les permissions nécessaires.
- **Erreur de port** : Si vous obtenez une erreur "address already in use", modifiez la variable PORT dans le fichier .env.
- **L'IA ne répond pas** : Vérifiez que votre clé API OpenRouter est valide et que le canal a été correctement configuré.
- **L'IA jailbreak ne fonctionne pas correctement** : Le jailbreak fonctionne mieux avec les modèles DeepSeek et Gemini. Assurez-vous que MongoDB est correctement configuré pour l'historique des conversations.
- **MongoDB n'est pas accessible** : Vérifiez votre URI de connexion MongoDB et assurez-vous que votre pare-feu autorise les connexions.
- **Les tickets ne se créent pas** : Vérifiez que le bot a les permissions nécessaires pour créer des canaux.
- **L'image ne s'affiche pas** : Assurez-vous que le fichier `ticket.png` est bien présent à la racine du projet.

## 🔄 Mise à jour

Pour mettre à jour le bot :

1. **Récupérez les dernières modifications**
   ```
   git pull
   ```

2. **Installez les nouvelles dépendances**
   ```
   npm install
   ```

3. **Redémarrez le bot**
   ```
   npm run restart
   ```

## 📝 Personnalisation

Vous pouvez personnaliser le bot en modifiant :

- Les phrases du captcha dans la fonction `generateCaptchaPhrase()`
- Les options du menu de tickets dans la commande `/createticket`
- Le modèle d'IA utilisé dans la fonction `callOpenRouterAPI()`
- Les couleurs et le contenu des embeds

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.

---

Pour toute question ou problème, n'hésitez pas à ouvrir une issue sur GitHub.
