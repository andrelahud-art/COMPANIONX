-- CompanionX World 2026 - Row Level Security Policies
-- Execute these after initial migration in Supabase

-- Enable RLS on all tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CompanionProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisitorProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Availability" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Message" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminLog" ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER TABLE
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON "User" FOR SELECT
  USING (auth.uid()::text = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON "User" FOR UPDATE
  USING (auth.uid()::text = id);

-- Public can view basic info of active companions
CREATE POLICY "Public can view active companions"
  ON "User" FOR SELECT
  USING (
    role = 'COMPANION'
    AND "isActive" = true
    AND "isBanned" = false
  );

-- ============================================
-- COMPANION PROFILE
-- ============================================

-- Companions can manage their own profile
CREATE POLICY "Companions manage own profile"
  ON "CompanionProfile" FOR ALL
  USING (auth.uid()::text = "userId");

-- Public can view active companion profiles
CREATE POLICY "Public can view active companions"
  ON "CompanionProfile" FOR SELECT
  USING ("isActive" = true);

-- ============================================
-- VISITOR PROFILE
-- ============================================

-- Visitors can manage their own profile
CREATE POLICY "Visitors manage own profile"
  ON "VisitorProfile" FOR ALL
  USING (auth.uid()::text = "userId");

-- ============================================
-- AVAILABILITY
-- ============================================

-- Companions can manage their availability
CREATE POLICY "Companions manage availability"
  ON "Availability" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "CompanionProfile"
      WHERE id = "Availability"."companionId"
      AND "userId" = auth.uid()::text
    )
  );

-- Public can view available slots
CREATE POLICY "Public can view availability"
  ON "Availability" FOR SELECT
  USING ("isBooked" = false);

-- ============================================
-- BOOKING
-- ============================================

-- Visitors can view their bookings
CREATE POLICY "Visitors view own bookings"
  ON "Booking" FOR SELECT
  USING (auth.uid()::text = "visitorId");

-- Companions can view their bookings
CREATE POLICY "Companions view own bookings"
  ON "Booking" FOR SELECT
  USING (auth.uid()::text = "companionId");

-- Visitors can create bookings
CREATE POLICY "Visitors create bookings"
  ON "Booking" FOR INSERT
  WITH CHECK (auth.uid()::text = "visitorId");

-- Participants can update booking status
CREATE POLICY "Participants update bookings"
  ON "Booking" FOR UPDATE
  USING (
    auth.uid()::text = "visitorId"
    OR auth.uid()::text = "companionId"
  );

-- ============================================
-- MESSAGE
-- ============================================

-- Users can view messages they sent or received
CREATE POLICY "Users view own messages"
  ON "Message" FOR SELECT
  USING (
    auth.uid()::text = "fromUserId"
    OR auth.uid()::text = "toUserId"
  );

-- Users can send messages
CREATE POLICY "Users send messages"
  ON "Message" FOR INSERT
  WITH CHECK (auth.uid()::text = "fromUserId");

-- Users can mark messages as read
CREATE POLICY "Users mark messages read"
  ON "Message" FOR UPDATE
  USING (auth.uid()::text = "toUserId");

-- ============================================
-- REVIEW
-- ============================================

-- Public can view visible reviews
CREATE POLICY "Public view reviews"
  ON "Review" FOR SELECT
  USING ("isVisible" = true AND "flagged" = false);

-- Visitors can create reviews for their bookings
CREATE POLICY "Visitors create reviews"
  ON "Review" FOR INSERT
  WITH CHECK (
    auth.uid()::text = "visitorId"
    AND EXISTS (
      SELECT 1 FROM "Booking"
      WHERE id = "Review"."bookingId"
      AND "visitorId" = auth.uid()::text
      AND status = 'COMPLETED'
    )
  );

-- Companions can respond to reviews
CREATE POLICY "Companions respond to reviews"
  ON "Review" FOR UPDATE
  USING (auth.uid()::text = "companionId");

-- ============================================
-- ADMIN LOG
-- ============================================

-- Only admins can access logs
CREATE POLICY "Admins access logs"
  ON "AdminLog" FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND role = 'ADMIN'
    )
  );

-- ============================================
-- SERVICE ROLE BYPASS
-- ============================================
-- Service role (server-side) bypasses all RLS
-- Configured via Supabase client with service_role key
