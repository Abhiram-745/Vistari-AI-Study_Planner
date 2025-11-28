-- Drop and recreate the check_and_grant_referral_premium function to grant usage limits instead
CREATE OR REPLACE FUNCTION public.check_and_grant_referral_premium(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  valid_referral_count INTEGER;
  rewards_already_granted INTEGER;
  rewards_to_grant INTEGER;
BEGIN
  -- Count valid referrals for this user's referral code
  SELECT COUNT(*) INTO valid_referral_count
  FROM public.referral_uses ru
  JOIN public.referral_codes rc ON rc.id = ru.referral_code_id
  WHERE rc.user_id = _user_id AND ru.is_valid = true;
  
  -- Calculate how many reward tiers earned (every 5 referrals = 1 tier)
  rewards_to_grant := valid_referral_count / 5;
  
  -- Check how many rewards already granted via premium_grants
  SELECT COUNT(*) INTO rewards_already_granted
  FROM public.premium_grants
  WHERE user_id = _user_id 
    AND grant_type = 'referral_reward';
  
  -- If new rewards earned, grant them
  IF rewards_to_grant > rewards_already_granted THEN
    -- Record the reward grant
    INSERT INTO public.premium_grants (user_id, grant_type, starts_at, expires_at)
    VALUES (_user_id, 'referral_reward', now(), now() + interval '100 years');
    
    -- Ensure usage_limits record exists
    INSERT INTO public.usage_limits (user_id, last_reset_date)
    VALUES (_user_id, CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Decrease usage counts (effectively granting +1 creation and +1 regeneration)
    -- We decrease the counts so they have more remaining
    UPDATE public.usage_limits
    SET 
      timetable_creations = GREATEST(timetable_creations - 1, 0),
      timetable_regenerations = GREATEST(timetable_regenerations - 1, 0),
      updated_at = now()
    WHERE user_id = _user_id;
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;

-- Create a function to get referral rewards count
CREATE OR REPLACE FUNCTION public.get_referral_rewards_count(_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COUNT(*)::integer
  FROM public.premium_grants
  WHERE user_id = _user_id 
    AND grant_type = 'referral_reward';
$function$;