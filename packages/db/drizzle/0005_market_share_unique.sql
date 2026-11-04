DELETE FROM "market_share" a USING "market_share" b
WHERE a.id < b.id AND a.region = b.region AND a.platform = b.platform AND a.captured_at = b.captured_at;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "market_share_uniq" ON "market_share" USING btree ("region","platform","captured_at");
