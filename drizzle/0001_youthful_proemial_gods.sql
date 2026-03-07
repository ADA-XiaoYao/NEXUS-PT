CREATE TABLE `access_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`exploit_id` int NOT NULL,
	`target_id` int NOT NULL,
	`level` varchar(100) NOT NULL,
	`username` varchar(255),
	`privileges` text,
	`lateral_movement_possible` boolean DEFAULT false,
	`persistence_mechanism` text,
	`evidence` json,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `access_levels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `agent_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`task_id` varchar(64),
	`agent_id` varchar(100) NOT NULL,
	`level` enum('debug','info','warning','error') NOT NULL,
	`message` text NOT NULL,
	`context` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `agent_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `evidence` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`type` enum('screenshot','log','file','command_output','network_capture') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`s3_key` varchar(1024) NOT NULL,
	`s3_url` varchar(2048),
	`mime_type` varchar(100),
	`file_size` int,
	`related_vulnerability_id` int,
	`related_exploit_id` int,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `evidence_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `exploits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`vulnerability_id` int NOT NULL,
	`tool` varchar(100) NOT NULL,
	`payload` text,
	`status` enum('attempted','successful','failed','partial') NOT NULL,
	`access_level` varchar(100),
	`evidence` json,
	`output` text,
	`executed_at` timestamp DEFAULT (now()),
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `exploits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pentest_projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`user_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`status` enum('planning','in_progress','completed','archived') NOT NULL DEFAULT 'planning',
	`scope` text NOT NULL,
	`objectives` text NOT NULL,
	`constraints` text,
	`start_date` timestamp,
	`end_date` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pentest_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`executive_summary` text,
	`technical_findings` text,
	`recommendations` text,
	`status` enum('draft','review','final','archived') NOT NULL DEFAULT 'draft',
	`format` enum('pdf','html','markdown') NOT NULL DEFAULT 'pdf',
	`s3_key` varchar(1024),
	`s3_url` varchar(2048),
	`generated_at` timestamp,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`target_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`port` int NOT NULL,
	`protocol` varchar(50) NOT NULL,
	`version` varchar(255),
	`fingerprint` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` enum('domain','ip','ip_range','service','application') NOT NULL,
	`value` varchar(1024) NOT NULL,
	`description` text,
	`os_type` varchar(100),
	`status` enum('discovered','assessed','exploited','cleaned') NOT NULL DEFAULT 'discovered',
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `targets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` varchar(64) NOT NULL,
	`project_id` int NOT NULL,
	`type` enum('recon','scan','vuln_analysis','exploit','post_exploit','report_generation') NOT NULL,
	`agent_id` varchar(100) NOT NULL,
	`status` enum('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
	`priority` enum('high','medium','low') NOT NULL DEFAULT 'medium',
	`payload` json,
	`result` json,
	`error` text,
	`started_at` timestamp,
	`completed_at` timestamp,
	`timeout` int,
	`retries` int DEFAULT 0,
	`max_retries` int DEFAULT 3,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vulnerabilities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`project_id` int NOT NULL,
	`service_id` int,
	`cve_id` varchar(50),
	`title` varchar(500) NOT NULL,
	`description` text,
	`type` varchar(100) NOT NULL,
	`severity` enum('critical','high','medium','low','info') NOT NULL,
	`cvss_score` decimal(3,1),
	`exploitable` boolean DEFAULT false,
	`exploited_at` timestamp,
	`evidence` json,
	`remediation` text,
	`metadata` json,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vulnerabilities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `idx_access_project_id` ON `access_levels` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_access_exploit_id` ON `access_levels` (`exploit_id`);--> statement-breakpoint
CREATE INDEX `idx_access_target_id` ON `access_levels` (`target_id`);--> statement-breakpoint
CREATE INDEX `idx_log_project_id` ON `agent_logs` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_log_task_id` ON `agent_logs` (`task_id`);--> statement-breakpoint
CREATE INDEX `idx_log_agent_id` ON `agent_logs` (`agent_id`);--> statement-breakpoint
CREATE INDEX `idx_log_level` ON `agent_logs` (`level`);--> statement-breakpoint
CREATE INDEX `idx_evidence_project_id` ON `evidence` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_evidence_vuln_id` ON `evidence` (`related_vulnerability_id`);--> statement-breakpoint
CREATE INDEX `idx_evidence_exploit_id` ON `evidence` (`related_exploit_id`);--> statement-breakpoint
CREATE INDEX `idx_exploit_project_id` ON `exploits` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_exploit_vuln_id` ON `exploits` (`vulnerability_id`);--> statement-breakpoint
CREATE INDEX `idx_exploit_status` ON `exploits` (`status`);--> statement-breakpoint
CREATE INDEX `idx_user_id` ON `pentest_projects` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `pentest_projects` (`status`);--> statement-breakpoint
CREATE INDEX `idx_report_project_id` ON `reports` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_report_status` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `idx_service_target_id` ON `services` (`target_id`);--> statement-breakpoint
CREATE INDEX `idx_service_port` ON `services` (`port`);--> statement-breakpoint
CREATE INDEX `idx_target_project_id` ON `targets` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_target_type` ON `targets` (`type`);--> statement-breakpoint
CREATE INDEX `idx_task_project_id` ON `tasks` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_task_status` ON `tasks` (`status`);--> statement-breakpoint
CREATE INDEX `idx_task_type` ON `tasks` (`type`);--> statement-breakpoint
CREATE INDEX `idx_vuln_project_id` ON `vulnerabilities` (`project_id`);--> statement-breakpoint
CREATE INDEX `idx_vuln_service_id` ON `vulnerabilities` (`service_id`);--> statement-breakpoint
CREATE INDEX `idx_vuln_cve_id` ON `vulnerabilities` (`cve_id`);--> statement-breakpoint
CREATE INDEX `idx_vuln_severity` ON `vulnerabilities` (`severity`);