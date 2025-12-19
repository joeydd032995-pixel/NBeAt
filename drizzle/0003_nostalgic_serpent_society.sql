CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`playerName` varchar(200) NOT NULL,
	`alertType` enum('points','rebounds','assists','streak','custom') NOT NULL,
	`condition` varchar(50) NOT NULL,
	`threshold` varchar(20) NOT NULL,
	`consecutiveGames` int DEFAULT 1,
	`isActive` int NOT NULL DEFAULT 1,
	`lastTriggered` timestamp,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
