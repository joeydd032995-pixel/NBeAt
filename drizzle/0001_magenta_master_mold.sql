CREATE TABLE `bankrollSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalBankroll` varchar(20) NOT NULL,
	`kellyMultiplier` varchar(20) NOT NULL DEFAULT '0.25',
	`riskTolerance` enum('conservative','moderate','aggressive') NOT NULL DEFAULT 'moderate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bankrollSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `bankrollSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`betType` varchar(50) NOT NULL,
	`stake` varchar(20) NOT NULL,
	`odds` varchar(20) NOT NULL,
	`probability` varchar(20),
	`ev` varchar(20),
	`kellyFraction` varchar(20),
	`outcome` enum('pending','won','lost') NOT NULL DEFAULT 'pending',
	`profit` varchar(20),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parlays` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`ticketNumber` int,
	`ticketName` varchar(100),
	`legs` text NOT NULL,
	`combinedProb` varchar(20),
	`totalOdds` varchar(20),
	`stake` varchar(20),
	`outcome` enum('pending','won','lost') NOT NULL DEFAULT 'pending',
	`profit` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parlays_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`externalId` int,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`fullName` varchar(200) NOT NULL,
	`teamId` int,
	`position` varchar(20),
	`ppg` varchar(20),
	`rpg` varchar(20),
	`apg` varchar(20),
	`fgPct` varchar(20),
	`gamesPlayed` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`abbr` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `teams_id` PRIMARY KEY(`id`),
	CONSTRAINT `teams_abbr_unique` UNIQUE(`abbr`)
);
