const { Client, GatewayIntentBits, Partials, EmbedBuilder, PermissionFlagsBits, ChannelType, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Chemin vers le dossier de sauvegarde
const BACKUP_DIR = path.join(__dirname, 'backups');

// Créer le dossier de sauvegarde s'il n'existe pas
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

// Fonction pour créer une sauvegarde du serveur
async function createBackup(guild, client) {
  try {
    console.log(`Création d'une sauvegarde pour le serveur ${guild.name}...`);
    
    // Créer un objet pour stocker les données de sauvegarde
    const backup = {
      name: guild.name,
      iconURL: guild.iconURL({ dynamic: true }),
      bannerURL: guild.bannerURL(),
      ownerId: guild.ownerId,
      createdAt: new Date().toISOString(),
      channels: [],
      roles: [],
      emojis: [],
      members: [],
      settings: {
        verificationLevel: guild.verificationLevel,
        explicitContentFilter: guild.explicitContentFilter,
        defaultMessageNotifications: guild.defaultMessageNotifications
      }
    };
    
    // Sauvegarder les rôles (sauf @everyone)
    console.log('Sauvegarde des rôles...');
    const roles = Array.from(guild.roles.cache.values())
      .filter(role => role.id !== guild.id) // Exclure @everyone
      .sort((a, b) => b.position - a.position); // Trier par position
    
    for (const role of roles) {
      backup.roles.push({
        name: role.name,
        color: role.color,
        hoist: role.hoist,
        mentionable: role.mentionable,
        permissions: role.permissions.bitfield.toString(),
        position: role.position
      });
    }
    
    // Sauvegarder les emojis
    console.log('Sauvegarde des emojis...');
    const emojis = Array.from(guild.emojis.cache.values());
    
    for (const emoji of emojis) {
      // Télécharger l'image de l'emoji
      const emojiURL = emoji.url;
      const emojiData = await downloadImage(emojiURL);
      
      backup.emojis.push({
        name: emoji.name,
        animated: emoji.animated,
        data: emojiData
      });
    }
    
    // Sauvegarder les membres (uniquement les informations de base)
    console.log('Sauvegarde des membres...');
    const members = Array.from(guild.members.cache.values());
    
    for (const member of members) {
      if (member.user.bot) continue; // Ignorer les bots
      
      const memberRoles = Array.from(member.roles.cache.values())
        .filter(role => role.id !== guild.id) // Exclure @everyone
        .map(role => role.name);
      
      backup.members.push({
        id: member.id,
        tag: member.user.tag,
        nickname: member.nickname,
        roles: memberRoles,
        joinedAt: member.joinedAt.toISOString()
      });
    }
    
    // Sauvegarder les canaux
    console.log('Sauvegarde des canaux...');
    const channels = Array.from(guild.channels.cache.values())
      .sort((a, b) => a.position - b.position);
    
    for (const channel of channels) {
      const channelData = {
        name: channel.name,
        type: channel.type,
        position: channel.position,
        parent: channel.parent ? channel.parent.name : null,
        permissionOverwrites: Array.from(channel.permissionOverwrites.cache.values()).map(overwrite => ({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.bitfield.toString(),
          deny: overwrite.deny.bitfield.toString()
        }))
      };
      
      // Pour les canaux de texte, sauvegarder les messages récents (limité à 100)
      if (channel.type === ChannelType.GuildText) {
        try {
          const messages = await channel.messages.fetch({ limit: 100 });
          channelData.messages = Array.from(messages.values()).map(msg => ({
            content: msg.content,
            author: {
              id: msg.author.id,
              tag: msg.author.tag
            },
            createdAt: msg.createdAt.toISOString(),
            embeds: msg.embeds.map(embed => embed.toJSON()),
            attachments: Array.from(msg.attachments.values()).map(attachment => ({
              url: attachment.url,
              name: attachment.name,
              size: attachment.size
            }))
          })).reverse(); // Inverser pour restaurer dans le bon ordre
        } catch (error) {
          console.error(`Erreur lors de la récupération des messages pour ${channel.name}:`, error);
          channelData.messages = [];
        }
      }
      
      backup.channels.push(channelData);
    }
    
    // Sauvegarder la sauvegarde dans un fichier
    const backupPath = path.join(BACKUP_DIR, `backup_${guild.id}_${Date.now()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
    
    console.log(`Sauvegarde terminée et enregistrée dans ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('Erreur lors de la création de la sauvegarde:', error);
    throw error;
  }
}

// Fonction pour télécharger une image et la convertir en base64
async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');
    return buffer.toString('base64');
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image:', error);
    return null;
  }
}

// Fonction pour restaurer une sauvegarde
async function restoreBackup(backupPath, guild, client) {
  try {
    console.log(`Restauration de la sauvegarde ${backupPath} pour le serveur ${guild.name}...`);
    
    // Charger la sauvegarde
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    // Mettre à jour les paramètres du serveur
    console.log('Mise à jour des paramètres du serveur...');
    await guild.setName(backupData.name);
    if (backupData.iconURL) {
      const iconData = await downloadImage(backupData.iconURL);
      if (iconData) {
        await guild.setIcon(Buffer.from(iconData, 'base64'));
      }
    }
    
    // Supprimer tous les canaux existants
    console.log('Suppression des canaux existants...');
    for (const channel of guild.channels.cache.values()) {
      await channel.delete().catch(console.error);
    }
    
    // Supprimer tous les rôles existants (sauf @everyone)
    console.log('Suppression des rôles existants...');
    for (const role of guild.roles.cache.values()) {
      if (role.id !== guild.id) { // Ne pas supprimer @everyone
        await role.delete().catch(console.error);
      }
    }
    
    // Supprimer tous les emojis existants
    console.log('Suppression des emojis existants...');
    for (const emoji of guild.emojis.cache.values()) {
      await emoji.delete().catch(console.error);
    }
    
    // Créer les rôles
    console.log('Création des rôles...');
    const roleMap = new Map(); // Pour stocker la correspondance entre les noms de rôles et les nouveaux IDs
    
    for (const roleData of backupData.roles) {
      try {
        const role = await guild.roles.create({
          name: roleData.name,
          color: roleData.color,
          hoist: roleData.hoist,
          mentionable: roleData.mentionable,
          permissions: BigInt(roleData.permissions),
          position: roleData.position
        });
        
        roleMap.set(roleData.name, role.id);
        console.log(`Rôle créé: ${role.name}`);
      } catch (error) {
        console.error(`Erreur lors de la création du rôle ${roleData.name}:`, error);
      }
    }
    
    // Créer les emojis
    console.log('Création des emojis...');
    for (const emojiData of backupData.emojis) {
      try {
        const buffer = Buffer.from(emojiData.data, 'base64');
        await guild.emojis.create({
          attachment: buffer,
          name: emojiData.name
        });
        console.log(`Emoji créé: ${emojiData.name}`);
      } catch (error) {
        console.error(`Erreur lors de la création de l'emoji ${emojiData.name}:`, error);
      }
    }
    
    // Créer les catégories d'abord
    console.log('Création des catégories...');
    const categoryMap = new Map(); // Pour stocker la correspondance entre les noms de catégories et les nouveaux IDs
    
    for (const channelData of backupData.channels) {
      if (channelData.type === ChannelType.GuildCategory) {
        try {
          const category = await guild.channels.create({
            name: channelData.name,
            type: ChannelType.GuildCategory,
            position: channelData.position
          });
          
          categoryMap.set(channelData.name, category.id);
          console.log(`Catégorie créée: ${category.name}`);
        } catch (error) {
          console.error(`Erreur lors de la création de la catégorie ${channelData.name}:`, error);
        }
      }
    }
    
    // Créer les autres canaux
    console.log('Création des canaux...');
    const channelMap = new Map(); // Pour stocker la correspondance entre les noms de canaux et les nouveaux IDs
    
    for (const channelData of backupData.channels) {
      if (channelData.type !== ChannelType.GuildCategory) {
        try {
          const channelOptions = {
            name: channelData.name,
            type: channelData.type,
            position: channelData.position
          };
          
          // Ajouter la catégorie parent si elle existe
          if (channelData.parent && categoryMap.has(channelData.parent)) {
            channelOptions.parent = categoryMap.get(channelData.parent);
          }
          
          const channel = await guild.channels.create(channelOptions);
          
          channelMap.set(channelData.name, channel.id);
          console.log(`Canal créé: ${channel.name}`);
          
          // Restaurer les messages pour les canaux de texte
          if (channelData.type === ChannelType.GuildText && channelData.messages && channelData.messages.length > 0) {
            console.log(`Restauration des messages pour ${channel.name}...`);
            
            // Utiliser un webhook pour envoyer des messages au nom des utilisateurs originaux
            const webhook = await channel.createWebhook({
              name: 'Restauration',
              avatar: client.user.displayAvatarURL()
            });
            
            for (const messageData of channelData.messages) {
              try {
                // Ignorer les messages vides
                if (!messageData.content && (!messageData.embeds || messageData.embeds.length === 0)) {
                  continue;
                }
                
                await webhook.send({
                  content: messageData.content,
                  username: messageData.author.tag,
                  avatarURL: `https://cdn.discordapp.com/avatars/${messageData.author.id}/${messageData.author.avatar}.png`,
                  embeds: messageData.embeds
                });
              } catch (error) {
                console.error(`Erreur lors de la restauration d'un message dans ${channel.name}:`, error);
              }
            }
            
            // Supprimer le webhook après utilisation
            await webhook.delete();
          }
        } catch (error) {
          console.error(`Erreur lors de la création du canal ${channelData.name}:`, error);
        }
      }
    }
    
    // Créer un canal d'invitation pour les membres
    console.log('Création d\'un canal d\'invitation...');
    const inviteChannel = await guild.channels.create({
      name: 'restauration',
      type: ChannelType.GuildText
    });
    
    // Créer une invitation permanente
    const invite = await inviteChannel.createInvite({
      maxAge: 0, // Invitation permanente
      maxUses: 0, // Utilisations illimitées
      unique: true
    });
    
    // Envoyer un message avec l'invitation
    const inviteEmbed = new EmbedBuilder()
      .setTitle('🔄 Restauration du Serveur')
      .setDescription(`Ce serveur a été restauré à partir d'une sauvegarde.\n\nUtilisez ce lien pour inviter les membres: ${invite.url}\n\nListe des membres à inviter:`)
      .setColor('#3498DB')
      .setTimestamp();
    
    // Ajouter la liste des membres à inviter
    let membersList = '';
    for (const memberData of backupData.members) {
      membersList += `- ${memberData.tag}\n`;
    }
    
    inviteEmbed.addFields({ name: 'Membres', value: membersList.length > 1024 ? membersList.substring(0, 1021) + '...' : membersList });
    
    await inviteChannel.send({ embeds: [inviteEmbed] });
    
    console.log(`Restauration terminée. Lien d'invitation: ${invite.url}`);
    return invite.url;
  } catch (error) {
    console.error('Erreur lors de la restauration de la sauvegarde:', error);
    throw error;
  }
}

// Fonction pour obtenir la liste des sauvegardes disponibles
function getBackupsList() {
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    return files
      .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);
        
        // Extraire l'ID du serveur du nom de fichier
        const match = file.match(/backup_(\d+)_(\d+)\.json/);
        const guildId = match ? match[1] : 'inconnu';
        const timestamp = match ? parseInt(match[2]) : 0;
        
        return {
          filename: file,
          path: filePath,
          guildId,
          createdAt: new Date(timestamp),
          size: stats.size
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // Trier par date (plus récent en premier)
  } catch (error) {
    console.error('Erreur lors de la récupération de la liste des sauvegardes:', error);
    return [];
  }
}

module.exports = {
  createBackup,
  restoreBackup,
  getBackupsList
}; 