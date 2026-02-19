ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;

UPDATE public.profiles p
SET is_premium = true
WHERE EXISTS (
  SELECT 1
  FROM public.payments pay
  WHERE pay.user_id = p.user_id
    AND pay.status = 'success'
);

CREATE INDEX IF NOT EXISTS idx_profiles_is_premium
ON public.profiles(is_premium);
