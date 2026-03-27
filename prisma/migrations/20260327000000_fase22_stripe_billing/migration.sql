-- FASE 22: Stripe Billing — Agregar campos Stripe a Subscription
ALTER TABLE "Subscription"
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "stripePriceId"        TEXT,
  ADD COLUMN "stripeCurrentPeriodEnd" TIMESTAMP(3);

CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key"
  ON "Subscription"("stripeSubscriptionId");
