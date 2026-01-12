CREATE TABLE "accounts_payable" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"due_date" text NOT NULL,
	"payment_date" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"supplier_id" varchar,
	"category_id" varchar,
	"cost_center_id" varchar,
	"payment_method" text,
	"late_fees" numeric(15, 2),
	"notes" text,
	"attachment_url" text,
	"recurrence" text,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts_receivable" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"due_date" text NOT NULL,
	"received_date" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"client_id" varchar,
	"category_id" varchar,
	"notes" text,
	"mercado_pago_id" text,
	"discount" numeric(15, 2)
);
--> statement-breakpoint
CREATE TABLE "balance_adjustments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"balance_type" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"account" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar
);
--> statement-breakpoint
CREATE TABLE "cash_flow_entries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"competence_date" date,
	"type" text NOT NULL,
	"movement_type" text DEFAULT 'normal' NOT NULL,
	"description" text NOT NULL,
	"category_id" varchar,
	"subcategory_id" varchar,
	"amount" numeric(10, 2) NOT NULL,
	"gross_amount" numeric(10, 2),
	"fees" numeric(10, 2),
	"payment_method" text NOT NULL,
	"account" text NOT NULL,
	"status" text DEFAULT 'confirmed' NOT NULL,
	"document" text,
	"cost_center" text,
	"recurrence" text,
	"due_date" date,
	"actual_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" varchar
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"dre_category" text
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"document" text,
	"email" text,
	"phone" text,
	"address" text
);
--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "mercado_pago_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"description" text,
	"amount" numeric(15, 2) NOT NULL,
	"fee" numeric(15, 2),
	"net_amount" numeric(15, 2),
	"transaction_date" text NOT NULL,
	"status" text NOT NULL,
	"reconciled" boolean DEFAULT false,
	"account_receivable_id" varchar
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"document" text,
	"email" text,
	"phone" text,
	"contact" text,
	"address" text,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "balance_adjustments" ADD CONSTRAINT "balance_adjustments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_subcategory_id_categories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_flow_entries" ADD CONSTRAINT "cash_flow_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;