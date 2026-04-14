DROP TABLE `tables`;--> statement-breakpoint
ALTER TABLE `products` ADD `allergens_confirmed` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `zones` ADD `nfc_token` text NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `zones_nfc_token_unique` ON `zones` (`nfc_token`);