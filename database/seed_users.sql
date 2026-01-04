
-- Enable pgcrypto for password hashing
create extension if not exists pgcrypto;

DO $$
DECLARE
  new_id uuid;
BEGIN
  -- 1. Goutham Krishna
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'krishnagoutham058@gmail.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'krishnagoutham058@gmail.com', crypt('12345678', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
    RETURNING id INTO new_id;
    
    INSERT INTO public.profiles (id, email, username, role, franchise_id)
    VALUES (new_id, 'krishnagoutham058@gmail.com', 'Goutham Krishna', 'franchise', 42);
  END IF;

  -- 2. Vaibhav Shette
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'vmsenterprise22@gmail.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'vmsenterprise22@gmail.com', crypt('#Vaibhav@123!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
    RETURNING id INTO new_id;
    
    INSERT INTO public.profiles (id, email, username, role, franchise_id)
    VALUES (new_id, 'vmsenterprise22@gmail.com', 'Vaibhav Shette', 'franchise', 63);
  END IF;

  -- 3. Abdul
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'finalv@example.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'finalv@example.com', crypt('password123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
    RETURNING id INTO new_id;
    
    INSERT INTO public.profiles (id, email, username, role, franchise_id)
    VALUES (new_id, 'finalv@example.com', 'Abdul ', 'franchise', 64);
  END IF;

    -- 4. Adam Sheez
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'adamsheez244@gmail.com') THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'adamsheez244@gmail.com', crypt('xbxbxnx', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now())
    RETURNING id INTO new_id;
    
    INSERT INTO public.profiles (id, email, username, role, franchise_id)
    VALUES (new_id, 'adamsheez244@gmail.com', 'Adam Sheez', 'franchise', 68);
  END IF;

END $$;
