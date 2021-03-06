module.exports = {
	checkCommand,
	checkTasks,
	getCommands,
	getGlobalPrefixes,
	getGuildPrefixes,
	registerCommandsFolder,
	registerTasksFolder,
	setModRoleGetter,
	setOwnerId,
	setGlobalPrefixes,
	setGuildPrefixes,
};

/**
 * A bot command
 * @typedef {Object} Command
 * @property {Boolean?} disabled Whether the command is disabled (default false)
 * @property {String} command The actual string to call the command with
 * @property {Array<String>} aliases The aliases of the command
 * @property {String?} description A short description of the command
 * @property {String?} usage Instructions on how to use the command
 * @property {Boolean?} ownerOnly Whether the command is only usable by the bot's owner (default false)
 * @property {Boolean?} adminOnly Whether the command is only usable by guild admins (users with the ADMINISTRATOR permission) (default false)
 * @property {Boolean?} modOnly Whether the command is only usable by guild moderators (users who have one or more of the mod roles) and guild admins (default false)
 * @property {Boolean?} inGuilds Whether the command is usable in guilds (default true)
 * @property {Boolean?} inDms Whether the command is usable in DMs (default true)
 * @property {Boolean?} allowBots Whether the command is usable by other bots (default false)
 * @property {Boolean?} botsOnly Whether the command is ONLY usable by bots (this always sets allowBots to true) (default false)
 * @property {Boolean?} allowSelf Whether the command is usable by this bot (default false)
 * @property {Function} run The function defining command's behaviour
 */

/**
 * A bot task
 * @typedef {Object} Task
 * @property {Boolean?} disabled Whether the task is disabled (default false)
 * @property {String} name The name of the task (functions as its ID)
 * @property {Boolean} limited Whether a task is limited (at most one limited task can run per message)
 * @property {Boolean?} ownerOnly Whether the task is only triggered by messages from the bot's owner (default false)
 * @property {Boolean?} adminOnly Whether the task is only triggered by messages from guild admins (users with the ADMINISTRATOR permission) (default false)
 * @property {Boolean?} modOnly Whether the task is only triggered by messages from guild moderators (users who have one or more of the mod roles) and guild admins (default false)
 * @property {Boolean?} inGuilds Whether the task is triggered by messages in guilds (default true)
 * @property {Boolean?} inDms Whether the task is triggered by messages in DMs (default true)
 * @property {Boolean?} allowBots Whether the task is triggered by messages from other bots (default false)
 * @property {Boolean?} botsOnly Whether the task is ONLY triggered by messages from bots (this always sets allowBots to true) (default false)
 * @property {Boolean?} allowSelf Whether the task is triggered by messages from this bot (default false)
 * @property {Function} test The function determining whether the task is executed
 * @property {Function} run The function defining task's behaviour
 */

/**
 * Results of checking the permissions of a command or a task
 * @typedef {Object} PermissionChecks
 * @property {Boolean} passChecks
 * @property {Boolean} passAdminCheck
 * @property {Boolean} passBotCheck
 * @property {Boolean} passChannelTypeCheck
 * @property {Boolean} passOwnerCheck
 * @property {Boolean} passSelfCheck
 */

/**
 * Context passed to a command when it is run
 * @typedef {Object} CommandContext
 * @property {Number} argsOffset The index of where in the message the command's arguments start
 * @property {String} args The command's arguments string
 * @property {Array<String>} argv List of the command's arguments when split by spaces
 * @property {String} command The alias used to trigger the command
 * @property {String} prefix The prefix used to trigger the command
 * @property {Command} commandObj The command
 */

/**
 * Context passed to a task when it is run
 * @typedef {Object} TaskContext
 * @property {Array<Task>} matching List of tasks that were triggered by the message
 * @property {Array<Task>} notMatchingList of tasks that weren't triggered by the message
 */

/**
 * Function to get a list of moderator roles from a guild ID
 * @typedef {Function} GetModRoles
 * @param {String} guildId ID of the guild to get the mod roles for
 * @returns {Promise<Array<String>>|Promise<Boolean>} Array of mod role IDs, or true to allow all
 */

const fs = require('fs');
const path = require('path');

const settings = {
	ownerId: false,
	globalPrefixes: [''],
	guildPrefixes: new Map(),
	getModRoles: () => [],
};

/** @type {Array<Command>} */
const commands = [];
/** @type {Array<Task>} */
const tasks = [];

/**
 * Checks whether a message matches a command and if so, runs the command
 * @param {Discord.Message} message The message to handle
 * @returns {Promise<Object>} Information about whether the message matched a command
 */
async function checkCommand(message) {
	const validPrefixes = settings.globalPrefixes;
	if (message.guild && settings.guildPrefixes.has(message.guild.id)) {
		validPrefixes.push(...settings.guildPrefixes.get(message.guild.id));
	}
	for (const prefix of validPrefixes) {
		for (const commandObj of commands) {
			const commandVariations = [commandObj.command, ...commandObj.aliases];
			for (const commandVariation of commandVariations) {
				if (message.content.toLowerCase().startsWith(`${prefix}${commandVariation}`) && /^\s|^$/.test(message.content.toLowerCase().slice(`${prefix}${commandVariation}`.length))) {
					if (message.guild && !message.member) {
						await message.guild.members.fetch(message.author);
					}

					const checks = await checkCommandPermissions(commandObj, message);

					if (checks.passChecks) {
						const argsOffset = commandVariation.length + prefix.length;
						const args = message.content.slice(argsOffset).trim();
						/** @type {CommandContext} */
						const commandContext = {
							argsOffset,
							args,
							argv: args ? args.split(/ +/) : [],
							command: commandVariation,
							prefix: prefix,
							commandObj,
						};
						await commandObj.run(message, commandContext);
					}

					return {
						match: true,
						command: commandVariation,
						checks,
						commandObj,
					};
				}
			}
		}
	}
	return {
		match: false,
	};
}

/**
 * Checks whether a command passes its permission checks
 * @param {Command} commandObj The command to check
 * @param {Discord.Message} message The message of the command
 * @returns {Promise<PermissionChecks>} Information about whether the command passes the permission checks
 */
async function checkCommandPermissions(commandObj, message) {
	const modRoles = message.guild ? (await settings.getModRoles(message.guild.id)) : [];

	const passAdminCheck = !commandObj.adminOnly || (message.guild && message.member.hasPermission('ADMINISTRATOR'));
	const passModCheck = !commandObj.modOnly || (message.guild && (message.member.hasPermission('ADMINISTRATOR') || modRoles === true || message.member.roles.cache.some(e => modRoles.includes(e.id))));
	const passBotCheck = message.author.bot ? commandObj.allowBots || commandObj.botsOnly || message.author.id === message.client.user.id : !commandObj.botsOnly;
	const passChannelTypeCheck = message.guild ? commandObj.inGuilds !== false : commandObj.inDms !== false;
	const passOwnerCheck = !commandObj.ownerOnly || settings.ownerId === true || (settings.ownerId !== false && message.author.id === settings.ownerId);
	const passSelfCheck = message.author.id !== message.client.user.id || commandObj.allowSelf;

	const passChecks = passAdminCheck && passModCheck && passBotCheck && passChannelTypeCheck && passOwnerCheck && passSelfCheck;

	return {
		passChecks,
		passAdminCheck,
		passModCheck,
		passBotCheck,
		passChannelTypeCheck,
		passOwnerCheck,
		passSelfCheck,
	};
}

/**
 * Checks whether a message matches any tasks and if so, runs the tasks
 * @param {Discord.Message} message The message to handle
 * @param {Boolean} excludeLimited Whether or not to exclude limited tasks
 * @returns {Promise<Object>} Information about whether the message matched any tasks
 */
async function checkTasks(message, excludeLimited) {
	let limitedSelected = false;
	/** @type {TaskContext} */
	const tasksContext = {
		matching: [],
		notMatching: [],
	};
	for (const taskObj of tasks) {
		let testResult;
		try {
			testResult = await taskObj.test(message);
		} catch (err) {
			testResult = false;
		}
		if (testResult && (await checkTaskPermissions(taskObj, message)).passChecks && (!taskObj.limited || (!limitedSelected && !excludeLimited))) {
			tasksContext.matching.push(taskObj);
			limitedSelected = taskObj.limited;
		} else {
			tasksContext.notMatching.push(taskObj);
		}
	}
	for (const taskObj of tasksContext.matching) {
		await taskObj.run(message, tasksContext);
	}
	return {
		match: tasksContext.matching.length !== 0,
		matching: tasksContext.matching,
		notMatching: tasksContext.notMatching,
	};
}

/**
 * Checks whether a task passes its permission checks
 * @param {Task} taskObj The task to check
 * @param {Discord.Message} message The message that triggered the task
 * @returns {Promise<PermissionChecks>} Information about whether the task passes the permission checks
 */
async function checkTaskPermissions(taskObj, message) {
	const modRoles = message.guild ? (await settings.getModRoles(message.guild.id)) : [];

	const passAdminCheck = !taskObj.adminOnly || (message.guild && message.member.hasPermission('ADMINISTRATOR'));
	const passModCheck = !taskObj.modOnly || (message.guild && (message.member.hasPermission('ADMINISTRATOR') || modRoles === true || message.member.roles.cache.some(e => modRoles.includes(e.id))));
	const passBotCheck = message.author.bot ? taskObj.allowBots || taskObj.botsOnly || message.author.id === message.client.user.id : !taskObj.botsOnly;
	const passChannelTypeCheck = message.guild ? taskObj.inGuilds !== false : taskObj.inDms !== false;
	const passOwnerCheck = !taskObj.ownerOnly || settings.ownerId === true || (settings.ownerId !== false && message.author.id === settings.ownerId);
	const passSelfCheck = message.author.id !== message.client.user.id || taskObj.allowSelf;

	const passChecks = passAdminCheck && passModCheck && passBotCheck && passChannelTypeCheck && passOwnerCheck && passSelfCheck;

	return {
		passChecks,
		passAdminCheck,
		passModCheck,
		passBotCheck,
		passChannelTypeCheck,
		passOwnerCheck,
		passSelfCheck,
	};
}

/**
 * Get a list of all registered commands
 * @returns {Array<Command>} Array of command objects
 */
function getCommands() {
	return commands.slice();
}

/**
 * Get a list of all global prefixes
 * @returns {Array<String>} Array of prefixes
 */
function getGlobalPrefixes() {
	return settings.globalPrefixes.slice();
}

/**
 * Get a list of all guild-specific prefixes for a certain guild
 * @param {String} guildId ID of the guild to get prefixes for
 * @returns {Array<String>} Array of prefixes
 */
function getGuildPrefixes(guildId) {
	return settings.guildPrefixes.has(guildId) ? settings.guildPrefixes.get(guildId).slice() : [];
}

/**
 * Registers all files in a folder as commands
 * @param {String} commandsFolder Absolute path to the folder with the command files
 * @returns {Object} Information about how many commands were registered and/or disabled
 */
function registerCommandsFolder(commandsFolder) {
	let disabled = 0;
	let registered = 0;

	const commandStrings = commands.map(e => e.command);

	const commandFiles = fs.readdirSync(commandsFolder);
	for (const commandFile of commandFiles) {
		/** @type {Command} */
		const commandObj = require(path.join(commandsFolder, commandFile)); // eslint-disable-line global-require
		if (typeof commandObj.command !== 'string') {
			throw new Error('Command must be a string');
		}
		commandObj.command = commandObj.command.trim().toLowerCase();
		if (commandObj.command === '' || commandObj.disabled === true) {
			disabled++;
			continue;
		}
		const commandVariations = [commandObj.command];
		if (Array.isArray(commandObj.aliases)) {
			if (commandObj.aliases.some(e => typeof e !== 'string')) {
				throw new Error('Command aliases must be strings');
			}
			commandObj.aliases = commandObj.aliases.map(e => e.trim().toLowerCase());
			commandVariations.push(...commandObj.aliases);
		} else {
			commandObj.aliases = [];
		}
		for (const commandVariation of commandVariations) {
			if (commandStrings.includes(commandVariation)) {
				throw new Error(`Duplicate command: ${commandVariation}${commandVariation !== commandObj.command ? ` (alias of ${commandObj.command})` : ''}`);
			}
		}
		commands.push(commandObj);
		commandStrings.push(...commandVariations);
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
		disabled,
		registered,
	};
}

/**
 * Registers all files in a folder as tasks
 * @param {String} tasksFolder Absolute path to the folder with the tasks files
 * @returns {Object} Information about how many tasks were registered and/or disabled
 */
function registerTasksFolder(tasksFolder) {
	let disabled = 0;
	let registered = 0;

	const tasknames = tasks.map(e => e.name);

	const taskFiles = fs.readdirSync(tasksFolder);
	for (const taskFile of taskFiles) {
		/** @type {Task} */
		const taskObj = require(path.join(tasksFolder, taskFile)); // eslint-disable-line global-require
		if (taskObj.disabled) {
			disabled++;
			continue;
		}
		if (tasknames.includes(taskObj.name)) {
			throw new Error('Duplicate task: ' + taskObj.name);
		}
		tasks.push(taskObj);
		tasknames.push(taskObj.name);
		registered++;
	}
	tasks.sort((a, b) => {
		if (a.name < b.name) {
			return -1;
		}
		if (a.name > b.name) {
			return 1;
		}
		return 0;
	});

	return {
		disabled,
		registered,
	};
}

/**
 * Sets the function used to get moderator roles
 * @param {GetModRoles} modRoleGetter The function used to get moderator roles
 * @returns {void}
 */
function setModRoleGetter(modRoleGetter) {
	if (typeof modRoleGetter !== 'function') {
		throw new Error('modRoleGetter must be a function');
	}
	settings.getModRoles = modRoleGetter;
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
 * Sets the global prefixes
 * @param {Array<String>|String} prefixes Prefix or list of prefixes to set
 * @returns {Array<String>} The set prefixes
 */
function setGlobalPrefixes(prefixes) {
	if (!prefixes) {
		settings.globalPrefixes = [];
		return [];
	}

	const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
	if (prefixList.length === 0) {
		prefixList.push('');
	}

	const uniquePrefixList = [...new Set(prefixList)];
	for (const prefix of uniquePrefixList) {
		if (typeof prefix !== 'string') {
			throw new Error('All prefixes must be strings');
		}
	}

	settings.globalPrefixes = uniquePrefixList;
	return uniquePrefixList;
}

/**
 * Sets the guild-specific prefixes for a certain guild
 * @param {String} guildId ID of the guild to set prefixes for
 * @param {Array<String>|String} prefixes Prefix or list of prefixes to set
 * @returns {Array<String>} The set prefixes
 */
function setGuildPrefixes(guildId, prefixes) {
	const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
	if (!prefixes || prefixList.length === 0) {
		settings.guildPrefixes.delete(guildId);
		return [];
	}

	const uniquePrefixList = [...new Set(prefixList)];
	for (const prefix of uniquePrefixList) {
		if (typeof prefix !== 'string') {
			throw new Error('All prefixes must be strings');
		}
	}

	settings.guildPrefixes.set(guildId, uniquePrefixList);
	return uniquePrefixList;
}
