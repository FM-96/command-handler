module.exports = {
	checkCommand,
	registerCommandsFolder,
	setAdminRoleName,
	setOwnerId,
	setPrefix,
};

const fs = require('fs');
const path = require('path');

const settings = {
	adminRoleName: false,
	ownerId: false,
	prefix: '',
};

const commands = [];

/**
 * Checks whether a message matches a command and if so, runs the command
 * @param {Discord.Message} message The message to handle
 * @returns {Promise<Boolean>} Whether the message matched a command
 */
async function checkCommand(message) {
	for (const commandObj of commands) {
		if (message.content.startsWith(`${settings.prefix}${commandObj.command}`) && /^\s|^$/.test(message.content.slice(`${settings.prefix}${commandObj.command}`.length))) {
			if (message.channel.type === 'text' && !message.member) {
				await message.guild.fetchMember(message.author);
			}

			const passOwnerCheck = !commandObj.ownerOnly || settings.ownerId === true || (settings.ownerId !== false && message.author.id === settings.ownerId);
			const passAdminCheck = !commandObj.adminOnly || settings.adminRoleName === true || (settings.adminRoleName !== false && message.channel.type === 'text' && message.member.roles.exists('name', settings.adminRoleName));
			const passChannelTypeCheck = message.channel.type === 'text' ? commandObj.inGuilds !== false : commandObj.inDms !== false;

			if (passOwnerCheck && passAdminCheck && passChannelTypeCheck) {
				const commandContext = {
					command: commandObj.command,
					prefix: settings.prefix,
				};
				await commandObj.run(message, commandContext);
			}
			return {
				match: true,
				command: commandObj.command,
				passOwnerCheck,
				passAdminCheck,
				passChannelTypeCheck,
			};
		}
	}
	return {
		match: false,
	};
}

/**
 * Registers all files in a folder as commands
 * @param {String} commandsFolder Absolute path to the folder with the command files
 * @returns {Object} Information about how many commands were registered and/or deactivated
 */
function registerCommandsFolder(commandsFolder) {
	let deactivated = 0;
	let registered = 0;

	const commandStrings = commands.map(e => e.command);

	const commandFiles = fs.readdirSync(commandsFolder);
	for (const commandFile of commandFiles) {
		const commandObj = require(path.join(commandsFolder, commandFile)); // eslint-disable-line global-require
		if (typeof commandObj.command !== 'string') {
			throw new Error('Command must be a string');
		}
		if (commandObj.command.trim() === '') {
			// command is deactivated
			deactivated++;
			continue;
		}
		if (commandStrings.includes(commandObj.command)) {
			throw new Error('Duplicate command: ' + commandObj.command);
		}
		commands.push(commandObj);
		commandStrings.push(commandObj.command);
		registered++;
	}
	commands.sort((a, b) => {
		if (a.command.length > b.command.length) {
			return -1;
		}
		if (a.command.length < b.command.length) {
			return 1;
		}
		return 0;
	});

	return {
		deactivated,
		registered,
	};
}

/**
 * Sets the admin role name
 * @param {String|Boolean} adminRoleName The admin role name, or true to allow all, or false to deny all
 * @returns {void}
 */
function setAdminRoleName(adminRoleName) {
	if (typeof adminRoleName !== 'string' && typeof adminRoleName !== 'boolean') {
		throw new Error('adminRoleName must be either a string or a boolean');
	} else if (adminRoleName === '') {
		throw new Error('adminRoleName cannot be an empty string');
	}
	settings.adminRoleName = adminRoleName;
}

/**
 * Sets the owner ID
 * @param {String|Boolean} ownerId The owner ID, or true to allow all, or false to deny all
 * @returns {void}
 */
function setOwnerId(ownerId) {
	if (typeof ownerId !== 'string' && typeof ownerId !== 'boolean') {
		throw new Error('ownerId must be either a string or a boolean');
	} else if (ownerId === '') {
		throw new Error('ownerId cannot be an empty string');
	}
	settings.ownerId = ownerId;
}

/**
 * Sets the prefix
 * @param {String} prefix The prefix
 * @returns {void}
 */
function setPrefix(prefix) {
	if (typeof prefix !== 'string') {
		throw new Error('prefix must be a string');
	}
	settings.prefix = prefix;
}
