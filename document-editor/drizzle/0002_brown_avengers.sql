CREATE TABLE `documentColors` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`paletteName` varchar(255) NOT NULL,
	`colors` text NOT NULL,
	`sourceImageUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentColors_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentLayers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`imageUrl` text NOT NULL,
	`layerName` varchar(255) NOT NULL,
	`opacity` int NOT NULL DEFAULT 100,
	`blendMode` varchar(50) NOT NULL DEFAULT 'normal',
	`zIndex` int NOT NULL DEFAULT 0,
	`positionX` int NOT NULL DEFAULT 0,
	`positionY` int NOT NULL DEFAULT 0,
	`width` int,
	`height` int,
	`visible` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentLayers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentWatermarks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`text` text NOT NULL,
	`opacity` int NOT NULL DEFAULT 30,
	`rotation` int NOT NULL DEFAULT 0,
	`position` varchar(50) NOT NULL DEFAULT 'center',
	`fontSize` int NOT NULL DEFAULT 48,
	`fontColor` varchar(7) NOT NULL DEFAULT '#000000',
	`enabled` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentWatermarks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `printMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentId` int NOT NULL,
	`userId` int NOT NULL,
	`materialType` varchar(100) NOT NULL,
	`materialName` varchar(255) NOT NULL,
	`dpi` int NOT NULL DEFAULT 300,
	`colorMode` varchar(50) NOT NULL DEFAULT 'RGB',
	`settings` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `printMaterials_id` PRIMARY KEY(`id`)
);
