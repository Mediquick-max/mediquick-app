CREATE TABLE "reminders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reminders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"medicine_name" text NOT NULL,
	"time" text NOT NULL,
	"taken" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "care_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "care_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"item_id" text NOT NULL,
	"title" text NOT NULL,
	"patient_name" text NOT NULL,
	"phone" text NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"mode" text DEFAULT '' NOT NULL,
	"date_slot" text NOT NULL,
	"status" text DEFAULT 'Confirmed' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"platform_fee" integer DEFAULT 0 NOT NULL,
	"provider_payout" integer DEFAULT 0 NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"payment_method" text DEFAULT 'online' NOT NULL,
	"user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "app_users_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"device_type" text DEFAULT 'web' NOT NULL,
	"password_hash" text DEFAULT '' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"gender" text DEFAULT '' NOT NULL,
	"date_of_birth" text DEFAULT '' NOT NULL,
	"blood_group" text DEFAULT '' NOT NULL,
	"allergies" text DEFAULT '' NOT NULL,
	"membership_expires_at" timestamp with time zone,
	"avatar_url" text DEFAULT '' NOT NULL,
	CONSTRAINT "app_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"plan" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"amount" integer DEFAULT 0 NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "payments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer NOT NULL,
	"user_name" text DEFAULT '' NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'INR' NOT NULL,
	"status" text DEFAULT 'success' NOT NULL,
	"gateway" text DEFAULT 'razorpay' NOT NULL,
	"transaction_id" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "api_config" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "api_config_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"provider" text NOT NULL,
	"label" text NOT NULL,
	"key_value" text DEFAULT '' NOT NULL,
	"is_active" text DEFAULT 'true' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_config_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "shopkeeper_medicines" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shopkeeper_medicines_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shopkeeper_id" integer NOT NULL,
	"name" text NOT NULL,
	"category" text DEFAULT 'General' NOT NULL,
	"price" double precision DEFAULT 0 NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"unit" text DEFAULT 'strip' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"manufacturer" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopkeeper_subscriptions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shopkeeper_subscriptions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shopkeeper_id" integer NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"medicine_limit" integer DEFAULT 10 NOT NULL,
	"amount_paid" double precision DEFAULT 0 NOT NULL,
	"razorpay_order_id" text DEFAULT '' NOT NULL,
	"razorpay_payment_id" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"expiry_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "doctors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"specialization" text NOT NULL,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"rating" double precision DEFAULT 4.5 NOT NULL,
	"total_reviews" integer DEFAULT 0 NOT NULL,
	"fee" integer DEFAULT 499 NOT NULL,
	"consultation_type" text DEFAULT 'both' NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"qualifications" text DEFAULT '' NOT NULL,
	"languages" text DEFAULT 'Hindi, English' NOT NULL,
	"city" text DEFAULT 'Mumbai' NOT NULL,
	"image_url" text DEFAULT '' NOT NULL,
	"available_slots" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"email" text,
	"password_hash" text,
	"phone" text,
	"registration_status" text DEFAULT 'approved' NOT NULL,
	"hospital_name" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"available_days" text DEFAULT 'Mon,Tue,Wed,Thu,Fri' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"payment_method" text DEFAULT 'upi' NOT NULL,
	"upi_id" text DEFAULT '' NOT NULL,
	"bank_account_holder" text DEFAULT '' NOT NULL,
	"bank_account_number" text DEFAULT '' NOT NULL,
	"bank_ifsc_code" text DEFAULT '' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "appointments" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "appointments_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"doctor_id" integer NOT NULL,
	"patient_name" text NOT NULL,
	"phone" text NOT NULL,
	"date" text NOT NULL,
	"time_slot" text NOT NULL,
	"health_issue" text DEFAULT '' NOT NULL,
	"consultation_type" text DEFAULT 'video' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"meeting_link" text DEFAULT '' NOT NULL,
	"razorpay_order_id" text DEFAULT '' NOT NULL,
	"razorpay_payment_id" text DEFAULT '' NOT NULL,
	"amount_paid" double precision DEFAULT 0 NOT NULL,
	"discount_amount" double precision DEFAULT 0 NOT NULL,
	"payment_method" text DEFAULT 'online' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doctor_reviews" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "doctor_reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"doctor_id" integer NOT NULL,
	"user_id" integer,
	"reviewer_name" text NOT NULL,
	"rating" double precision DEFAULT 5 NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicine_orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "medicine_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"user_id" integer,
	"patient_name" text NOT NULL,
	"phone" text NOT NULL,
	"delivery_address" text NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"pincode" text DEFAULT '' NOT NULL,
	"items" text NOT NULL,
	"total_amount" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'placed' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_centers" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "lab_centers_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"center_type" text DEFAULT 'diagnostic' NOT NULL,
	"city" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"accreditation" text DEFAULT '' NOT NULL,
	"registration_number" text DEFAULT '' NOT NULL,
	"plan" text DEFAULT 'starter' NOT NULL,
	"plan_expires_at" timestamp with time zone,
	"payment_method" text DEFAULT 'upi' NOT NULL,
	"upi_id" text DEFAULT '' NOT NULL,
	"bank_account_holder" text DEFAULT '' NOT NULL,
	"bank_account_number" text DEFAULT '' NOT NULL,
	"bank_ifsc_code" text DEFAULT '' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lab_centers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "daily_featured" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "daily_featured_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"featured_date" text NOT NULL,
	"fee_deducted" integer DEFAULT 499 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"type" text NOT NULL,
	"entity_id" integer NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_read" integer DEFAULT 0 NOT NULL,
	"slot_date" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shopkeeper_profiles" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shopkeeper_profiles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shopkeeper_id" integer NOT NULL,
	"shop_name" text DEFAULT '' NOT NULL,
	"shop_address" text DEFAULT '' NOT NULL,
	"shop_phone" text DEFAULT '' NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"city" text DEFAULT '' NOT NULL,
	"pincode" text DEFAULT '' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"payment_method" text DEFAULT 'upi' NOT NULL,
	"upi_id" text DEFAULT '' NOT NULL,
	"bank_account_holder" text DEFAULT '' NOT NULL,
	"bank_account_number" text DEFAULT '' NOT NULL,
	"bank_ifsc_code" text DEFAULT '' NOT NULL,
	"bank_name" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "shopkeeper_profiles_shopkeeper_id_unique" UNIQUE("shopkeeper_id")
);
--> statement-breakpoint
CREATE TABLE "local_medicine_orders" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "local_medicine_orders_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"shopkeeper_id" integer NOT NULL,
	"customer_id" integer,
	"customer_name" text NOT NULL,
	"customer_phone" text NOT NULL,
	"delivery_address" text NOT NULL,
	"delivery_lat" double precision,
	"delivery_lng" double precision,
	"distance_meters" integer DEFAULT 0 NOT NULL,
	"delivery_charge" double precision DEFAULT 0 NOT NULL,
	"platform_fee" double precision DEFAULT 0 NOT NULL,
	"subtotal" double precision DEFAULT 0 NOT NULL,
	"total_amount" double precision DEFAULT 0 NOT NULL,
	"medicines_json" text DEFAULT '[]' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;