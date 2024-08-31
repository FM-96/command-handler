import fs from 'node:fs';
import path from 'node:path';
import { type ClientUser, type GuildMember, type Message, PermissionFlagsBits } from 'discord.js';

/**
 * A bot command
 * @interface Command
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
export interface Command {
	disabled?: boolean;
	command: string;
	aliases: string[];
	description?: string;
	usage?: string;
	ownerOnly?: boolean;
	adminOnly?: boolean;
	modOnly?: boolean;
	inGuilds?: boolean;
	inDms?: boolean;
	allowBots?: boolean;
	botsOnly?: boolean;
	allowSelf?: boolean;
	run: (message: Message, context: CommandContext) => Promise<void>;
}

interface FullCommand {
	disabled: boolean;
	command: string;
	aliases: string[];
	description: string;
	usage: string;
	ownerOnly: boolean;
	adminOnly: boolean;
	modOnly: boolean;
	inGuilds: boolean;
	inDms: boolean;
	allowBots: boolean;
	botsOnly: boolean;
	allowSelf: boolean;
	run: (message: Message, context: CommandContext) => Promise<void>;
}

function defaultCommandValues(command: Command): FullCommand {
	return {
		disabled: command.disabled ?? false,
		command: command.command,
		aliases: command.aliases,
		description: command.description ?? '',
		usage: command.usage ?? '',
		ownerOnly: command.ownerOnly ?? false,
		adminOnly: command.adminOnly ?? false,
		modOnly: command.modOnly ?? false,
		inGuilds: command.inGuilds ?? true,
		inDms: command.inDms ?? true,
		allowBots: command.allowBots ?? false,
		botsOnly: command.botsOnly ?? false,
		allowSelf: command.allowSelf ?? false,
		run: command.run,
	};
}

/**
 * A bot task
 * @interface Task
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
export interface Task {
	disabled?: boolean;
	name: string;
	limited: boolean;
	ownerOnly?: boolean;
	adminOnly?: boolean;
	modOnly?: boolean;
	inGuilds?: boolean;
	inDms?: boolean;
	allowBots?: boolean;
	botsOnly?: boolean;
	allowSelf?: boolean;
	test: (message: Message) => Promise<boolean>;
	run: (message: Message, context: TaskContext) => Promise<void>;
}

interface FullTask {
	disabled: boolean;
	name: string;
	limited: boolean;
	ownerOnly: boolean;
	adminOnly: boolean;
	modOnly: boolean;
	inGuilds: boolean;
	inDms: boolean;
	allowBots: boolean;
	botsOnly: boolean;
	allowSelf: boolean;
	test: (message: Message) => Promise<boolean>;
	run: (message: Message, context: TaskContext) => Promise<void>;
}

function defaultTaskValues(task: Task): FullTask {
	return {
		disabled: task.disabled ?? false,
		name: task.name,
		limited: task.limited,
		ownerOnly: task.ownerOnly ?? false,
		adminOnly: task.adminOnly ?? false,
		modOnly: task.modOnly ?? false,
		inGuilds: task.inGuilds ?? true,
		inDms: task.inDms ?? true,
		allowBots: task.allowBots ?? false,
		botsOnly: task.botsOnly ?? false,
		allowSelf: task.allowSelf ?? false,
		test: task.test,
		run: task.run,
	};
}

/**
 * Results of checking the permissions of a command or a task
 * @interface PermissionChecks
 * @property {Boolean} passChecks
 * @property {Boolean} passAdminCheck
 * @property {Boolean} passModCheck
 * @property {Boolean} passBotCheck
 * @property {Boolean} passChannelTypeCheck
 * @property {Boolean} passOwnerCheck
 * @property {Boolean} passSelfCheck
 */
export interface PermissionChecks {
	passChecks: boolean;
	passAdminCheck: boolean;
	passModCheck: boolean;
	passBotCheck: boolean;
	passChannelTypeCheck: boolean;
	passOwnerCheck: boolean;
	passSelfCheck: boolean;
}

/**
 * Context passed to a command when it is run
 * @interface CommandContext
 * @property {Number} argsOffset The index of where in the message the command's arguments start
 * @property {String} args The command's arguments string
 * @property {Array<String>} argv List of the command's arguments when split by spaces
 * @property {String} command The alias used to trigger the command
 * @property {String} prefix The prefix used to trigger the command
 * @property {Command} commandObj The command
 */
export interface CommandContext {
	argsOffset: number;
	args: string;
	argv: string[];
	command: string;
	prefix: string;
	commandObj: Command;
}

/**
 * Context passed to a task when it is run
 * @interface TaskContext
 * @property {Array<Task>} matching List of tasks that were triggered by the message
 * @property {Array<Task>} notMatching of tasks that weren't triggered by the message
 */
export interface TaskContext {
	matching: Task[];
	notMatching: Task[];
}

/**
 * Function to get a list of moderator roles from a guild ID
 * @typedef {Function} GetModRoles
 * @param {String} guildId ID of the guild to get the mod roles for
 * @returns {Promise<Array<String>|Boolean>} Array of mod role IDs, or true to allow all
 */
export type GetModRoles = (guildId: string) => Promise<string[] | true>;

export interface Settings {
	ownerId: string | boolean;
	globalPrefixes: string[];
	guildPrefixes: Map<string, string[]>;
	getModRoles: GetModRoles;
}

const settings: Settings = {
	ownerId: false,
	globalPrefixes: [''],
	guildPrefixes: new Map(),
	getModRoles: async () => [],
};

const commands: Command[] = [];
const tasks: Task[] = [];

interface CommandMatchNoMatch {
	match: false;
}

interface CommandMatchMatch {
	match: true;
	command: string;
	checks: PermissionChecks;
	commandObj: Command;
}

export type CommandMatch = CommandMatchNoMatch | CommandMatchMatch;

/**
 * Checks whether a message matches a command and if so, runs the command
 * @param {Message} message The message to handle
 * @returns {Promise<CommandMatch>} Information about whether the message matched a command
 */
export async function checkCommand(message: Message): Promise<CommandMatch> {
	const validPrefixes = settings.globalPrefixes;
	if (message.guild && settings.guildPrefixes.has(message.guild.id)) {
		validPrefixes.push(...(settings.guildPrefixes.get(message.guild.id) as string[]));
	}
	for (const prefix of validPrefixes) {
		for (const commandObj of commands) {
			const commandVariations = [commandObj.command, ...commandObj.aliases];
			for (const commandVariation of commandVariations) {
				if (
					message.content.toLowerCase().startsWith(`${prefix}${commandVariation}`) &&
					/^\s|^$/.test(message.content.toLowerCase().slice(`${prefix}${commandVariation}`.length))
				) {
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
							prefix,
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
 * @param {Message} message The message of the command
 * @returns {Promise<PermissionChecks>} Information about whether the command passes the permission checks
 */
async function checkCommandPermissions(
	commandObj: Command,
	message: Message,
): Promise<PermissionChecks> {
	const modRoles = message.guild ? await settings.getModRoles(message.guild.id) : [];

	const fullCommandObj = defaultCommandValues(commandObj);

	const messageMember = message.member as GuildMember;
	const clientUser = message.client.user as ClientUser;

	const passAdminCheck =
		!fullCommandObj.adminOnly ||
		(Boolean(message.guild) && messageMember.permissions.has(PermissionFlagsBits.Administrator));

	const passModCheck =
		!fullCommandObj.modOnly ||
		(Boolean(message.guild) &&
			(messageMember.permissions.has(PermissionFlagsBits.Administrator) ||
				modRoles === true ||
				messageMember.roles.cache.some((e) => modRoles.includes(e.id))));

	const passBotCheck = message.author.bot
		? fullCommandObj.allowBots || fullCommandObj.botsOnly || message.author.id === clientUser.id
		: !fullCommandObj.botsOnly;

	const passChannelTypeCheck = message.guild ? fullCommandObj.inGuilds : fullCommandObj.inDms;

	const passOwnerCheck =
		!fullCommandObj.ownerOnly ||
		settings.ownerId === true ||
		(settings.ownerId !== false && message.author.id === settings.ownerId);

	const passSelfCheck = message.author.id !== clientUser.id || fullCommandObj.allowSelf;

	const passChecks =
		passAdminCheck &&
		passModCheck &&
		passBotCheck &&
		passChannelTypeCheck &&
		passOwnerCheck &&
		passSelfCheck;

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

export interface TaskMatch {
	match: boolean;
	matching: Task[];
	notMatching: Task[];
}

/**
 * Checks whether a message matches any tasks and if so, runs the tasks
 * @param {Message} message The message to handle
 * @param {Boolean} excludeLimited Whether or not to exclude limited tasks
 * @returns {Promise<TaskMatch>} Information about whether the message matched any tasks
 */
export async function checkTasks(message: Message, excludeLimited: boolean): Promise<TaskMatch> {
	let limitedSelected = false;
	const tasksContext: TaskContext = {
		matching: [],
		notMatching: [],
	};
	for (const taskObj of tasks) {
		let testResult: boolean;
		try {
			testResult = await taskObj.test(message);
		} catch (_err) {
			testResult = false;
		}
		if (
			testResult &&
			(await checkTaskPermissions(taskObj, message)).passChecks &&
			(!taskObj.limited || (!limitedSelected && !excludeLimited))
		) {
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
 * @param {Message} message The message that triggered the task
 * @returns {Promise<PermissionChecks>} Information about whether the task passes the permission checks
 */
async function checkTaskPermissions(taskObj: Task, message: Message): Promise<PermissionChecks> {
	const modRoles = message.guild ? await settings.getModRoles(message.guild.id) : [];

	if (message.guild && !message.member) {
		throw new Error('Should be unreachable');
	}

	const fullTaskObj = defaultTaskValues(taskObj);

	const messageMember = message.member as GuildMember;
	const clientUser = message.client.user as ClientUser;

	const passAdminCheck =
		!fullTaskObj.adminOnly ||
		(Boolean(message.guild) && messageMember.permissions.has(PermissionFlagsBits.Administrator));

	const passModCheck =
		!fullTaskObj.modOnly ||
		(Boolean(message.guild) &&
			(messageMember.permissions.has(PermissionFlagsBits.Administrator) ||
				modRoles === true ||
				messageMember.roles.cache.some((e) => modRoles.includes(e.id))));

	const passBotCheck = message.author.bot
		? fullTaskObj.allowBots || fullTaskObj.botsOnly || message.author.id === clientUser.id
		: !fullTaskObj.botsOnly;

	const passChannelTypeCheck = message.guild ? fullTaskObj.inGuilds : fullTaskObj.inDms;

	const passOwnerCheck =
		!fullTaskObj.ownerOnly ||
		settings.ownerId === true ||
		(settings.ownerId !== false && message.author.id === settings.ownerId);

	const passSelfCheck = message.author.id !== clientUser.id || fullTaskObj.allowSelf;

	const passChecks =
		passAdminCheck &&
		passModCheck &&
		passBotCheck &&
		passChannelTypeCheck &&
		passOwnerCheck &&
		passSelfCheck;

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
export function getCommands(): Command[] {
	return commands.slice();
}

/**
 * Get a list of all global prefixes
 * @returns {Array<String>} Array of prefixes
 */
export function getGlobalPrefixes(): string[] {
	return settings.globalPrefixes.slice();
}

/**
 * Get a list of all guild-specific prefixes for a certain guild
 * @param {String} guildId ID of the guild to get prefixes for
 * @returns {Array<String>} Array of prefixes
 */
export function getGuildPrefixes(guildId: string): string[] {
	return settings.guildPrefixes.has(guildId)
		? (settings.guildPrefixes.get(guildId) as string[]).slice()
		: [];
}

export interface CommandRegistrationInfo {
	registered: number;
	disabled: number;
}

/**
 * Registers all files in a folder as commands
 * @param {String} commandsFolder Absolute path to the folder with the command files
 * @returns {CommandRegistrationInfo} Information about how many commands were registered and/or disabled
 */
export function registerCommandsFolder(commandsFolder: string): CommandRegistrationInfo {
	let disabled = 0;
	let registered = 0;

	const commandStrings = commands.map((e) => e.command);

	const commandFiles = fs.readdirSync(commandsFolder);
	for (const commandFile of commandFiles) {
		/** @type {Command} */
		const commandImport = require(path.join(commandsFolder, commandFile)); // eslint-disable-line @typescript-eslint/no-var-requires
		const commandObj: Command = commandImport.default ?? commandImport;
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
			if (commandObj.aliases.some((e) => typeof e !== 'string')) {
				throw new Error('Command aliases must be strings');
			}
			commandObj.aliases = commandObj.aliases.map((e) => e.trim().toLowerCase());
			commandVariations.push(...commandObj.aliases);
		} else {
			commandObj.aliases = [];
		}
		for (const commandVariation of commandVariations) {
			if (commandStrings.includes(commandVariation)) {
				throw new Error(
					`Duplicate command: ${commandVariation}${commandVariation !== commandObj.command ? ` (alias of ${commandObj.command})` : ''}`,
				);
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

interface TaskRegistrationInfo {
	registered: number;
	disabled: number;
}

/**
 * Registers all files in a folder as tasks
 * @param {String} tasksFolder Absolute path to the folder with the tasks files
 * @returns {TaskRegistrationInfo} Information about how many tasks were registered and/or disabled
 */
export function registerTasksFolder(tasksFolder: string): TaskRegistrationInfo {
	let disabled = 0;
	let registered = 0;

	const tasknames = tasks.map((e) => e.name);

	const taskFiles = fs.readdirSync(tasksFolder);
	for (const taskFile of taskFiles) {
		const taskImport = require(path.join(tasksFolder, taskFile)); // eslint-disable-line @typescript-eslint/no-var-requires
		const taskObj: Task = taskImport.default ?? taskImport;
		if (taskObj.disabled === true) {
			disabled++;
			continue;
		}
		if (tasknames.includes(taskObj.name)) {
			throw new Error(`Duplicate task: ${taskObj.name}`);
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
export function setModRoleGetter(modRoleGetter: GetModRoles): void {
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
export function setOwnerId(ownerId: string | boolean): void {
	if (typeof ownerId !== 'string' && typeof ownerId !== 'boolean') {
		throw new Error('ownerId must be either a string or a boolean');
	}
	if (ownerId === '') {
		throw new Error('ownerId cannot be an empty string');
	}
	settings.ownerId = ownerId;
}

/**
 * Sets the global prefixes
 * @param {Array<String>|String} prefixes Prefix or list of prefixes to set
 * @returns {Array<String>} The set prefixes
 */
export function setGlobalPrefixes(prefixes: string[] | string): string[] {
	if (prefixes == null) {
		settings.globalPrefixes = [''];
		return [''];
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
export function setGuildPrefixes(guildId: string, prefixes: string[] | string): string[] {
	const prefixList = Array.isArray(prefixes) ? prefixes : [prefixes];
	if (prefixes == null || prefixList.length === 0) {
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

export default {
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
