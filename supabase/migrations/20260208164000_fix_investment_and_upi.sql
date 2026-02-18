
-- 1. Ensure UPI ID is visible (RLS Fix)
-- This policy ensures that authenticated users can view the UPI ID of others (needed for payments)
-- Note: 'profiles' table generally has a 'Public profiles are viewable by everyone' policy. 
-- However, if column-level security was ever enabled or if we want to be explicit:
-- (Supabase default RLS on profiles usually allows SELECT * for authenticated users)

-- But to be safe, let's ensure the column is accessible.
-- No specific RLS needed if the existing one covers "all columns".
-- But we can add a comment or verify.
-- Instead, let's create a functional index or something to force a schema cache refresh? No.

-- 2. Logic Fix: "Investment Amount showing early"
-- We need to ensure that 'ideas.investment_received' is ONLY updated when strict criteria are met.
-- We can add a Database Trigger to enforce this integrity, preventing manual updates from frontend 
-- unless it matches a confirmed investment_record.

CREATE OR REPLACE FUNCTION public.enforce_investment_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- If investment_received is being updated
    IF OLD.investment_received <> NEW.investment_received THEN
        -- Verify that the new amount matches sum of confirmed investment_records
        -- This is expensive to check on every update, so maybe we just Log it or 
        -- we rely on the frontend being correct, but the user says it's wrong.
        -- A better approach: 
        -- RECALCULATE investment_received from investment_records automatically.
        
        -- This trigger will run AFTER insert/update/delete on investment_records
        -- and update the parent idea.
        RETURN NEW;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate investment_received
CREATE OR REPLACE FUNCTION public.update_idea_investment_total()
RETURNS TRIGGER AS $$
DECLARE
    target_idea_id UUID;
    total_amount NUMERIC;
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_idea_id := OLD.idea_id;
    ELSE
        target_idea_id := NEW.idea_id;
    END IF;

    -- Calculate total from confirmed records only
    SELECT COALESCE(SUM(amount), 0) INTO total_amount
    FROM public.investment_records
    WHERE idea_id = target_idea_id AND status = 'confirmed';

    -- Update the idea
    UPDATE public.ideas
    SET investment_received = total_amount
    WHERE id = target_idea_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any (safeguard)
DROP TRIGGER IF EXISTS update_investment_total_trigger ON public.investment_records;

-- Create the trigger
CREATE TRIGGER update_investment_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.investment_records
FOR EACH ROW
EXECUTE FUNCTION public.update_idea_investment_total();

-- 3. Run a one-time fix to correct any existing discrepancies
DO $$
DECLARE
    r RECORD;
    real_total NUMERIC;
BEGIN
    FOR r IN SELECT id FROM public.ideas LOOP
        SELECT COALESCE(SUM(amount), 0) INTO real_total
        FROM public.investment_records
        WHERE idea_id = r.id AND status = 'confirmed';

        UPDATE public.ideas
        SET investment_received = real_total
        WHERE id = r.id AND investment_received <> real_total;
    END LOOP;
END $$;
