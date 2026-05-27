-- ──────────────────────────────────────────────────
-- Creative Ops — Database Seed & Reset Script
-- Copy and paste this script into your Supabase Dashboard SQL Editor
-- ──────────────────────────────────────────────────

DO $$
DECLARE
  v_user_id uuid;
  v_campaign_id_1 uuid;
  v_campaign_id_2 uuid;
  v_prompt_id_1 uuid;
  v_prompt_id_2 uuid;
  v_collection_id uuid;
BEGIN
  -- 1. Fetch the first user in the database
  SELECT id INTO v_user_id FROM public.users LIMIT 1;
  
  -- If no user is registered yet, exit with warning
  IF v_user_id IS NULL THEN
    RAISE NOTICE '⚠️ WARNING: No registered user found in public.users. Please sign up an account in the UI first, then run this seed script to populate data for your user!';
    RETURN;
  END IF;

  -- 2. Clean out existing mock data to reset to a completely fresh start
  DELETE FROM public.iterations;
  DELETE FROM public.portfolio_items;
  DELETE FROM public.campaigns;
  DELETE FROM public.prompts;
  DELETE FROM public.swipe_items;
  DELETE FROM public.swipe_collections;
  DELETE FROM public.workflows;
  DELETE FROM public.ai_tools;

  -- 3. Populate AI Tools Directory
  INSERT INTO public.ai_tools (id, name, slug, category, use_cases, pricing_model, rating, api_available, website_url, last_reviewed) VALUES
  ('44444444-4444-4444-4444-444444444441', 'Claude 3.5 Sonnet', 'claude-3-5-sonnet', 'LLM', '["Ad Copy", "Brief Drafting", "Concept Analysis", "SOP Generation"]', 'freemium', 4.9, true, 'https://anthropic.com', '2026-05-15'),
  ('44444444-4444-4444-4444-444444444442', 'Midjourney v6', 'midjourney-v6', 'Image Generation', '["Moodboarding", "Key Visual Direction", "Ad Assets"]', 'paid', 4.8, false, 'https://midjourney.com', '2026-05-10'),
  ('44444444-4444-4444-4444-444444444443', 'v0 by Vercel', 'v0-vercel', 'Code Generation', '["UI Prototyping", "Design System Mockups", "React Code"]', 'freemium', 4.7, true, 'https://v0.dev', '2026-05-20'),
  ('44444444-4444-4444-4444-444444444444', 'ElevenLabs', 'elevenlabs', 'Voice & Audio', '["AI Voiceovers", "Localization", "Audio Ads"]', 'freemium', 4.6, true, 'https://elevenlabs.io', '2026-05-01');

  -- 4. Populate Prompt Library
  INSERT INTO public.prompts (title, body, category, tags, version, author_id, is_public, model_target) VALUES
  (
    'High-Conversion SaaS Hero Copywriter', 
    'Write a SaaS hero headline and subheadline targeting {{target_audience}} using the {{brand_tone}} tone. Focus on solving the main pain point: {{pain_point}}. Ensure the headline is under 8 words and punchy, and the subheadline directly qualifies the value proposition in 1 sentence.', 
    'Copywriting', 
    '["saas", "hero-section", "copywriting", "conversion"]', 
    1, 
    v_user_id, 
    true, 
    'claude-sonnet-4-6'
  ) RETURNING id INTO v_prompt_id_1;

  INSERT INTO public.prompts (title, body, category, tags, version, author_id, is_public, model_target) VALUES
  (
    'Midjourney V6 Cyberpunk Scene Generator', 
    'A cinematic wide-angle shot of a {{subject}} in a glowing cyberpunk street in Neo-Tokyo, shot on 35mm lens, neon reflections in the puddles, dynamic lighting, cyberpunk aesthetic, photorealistic, Unreal Engine 5 render, highly detailed background, --ar 16:9 --v 6.0', 
    'Visual', 
    '["midjourney", "image-generation", "cyberpunk", "prompt-template"]', 
    1, 
    v_user_id, 
    true, 
    'claude-sonnet-4-6'
  ) RETURNING id INTO v_prompt_id_2;

  -- 5. Populate Campaigns
  INSERT INTO public.campaigns (name, brief, status, start_date, end_date, owner_id, tags, metrics) VALUES
  (
    'Neo-Tokyo Techwear Launch', 
    '{"objective": "Launch the new futuristic waterproof techwear capsule collection", "audience": "Urban explorers, fashion enthusiasts, techwear collectors aged 18-35", "tone": "Cyberpunk, rebel, premium, highly technical", "kpis": ["Direct sales", "Social engagement CTR", "Vault saves"]}', 
    'live', 
    '2026-06-01', 
    '2026-06-30', 
    v_user_id, 
    '["launch", "apparel", "cyberpunk", "fall-capsule"]', 
    '{"impressions": 142000, "conversions": 1840, "ctr": 3.82, "roas": 4.12}'
  ) RETURNING id INTO v_campaign_id_1;

  INSERT INTO public.campaigns (name, brief, status, start_date, end_date, owner_id, tags, metrics) VALUES
  (
    'AI Assistant Brand Rebrand', 
    '{"objective": "Rebrand the legacy virtual assistant to a futuristic autonomous creative AI partner", "audience": "Freelance creatives, agencies, remote design teams", "tone": "Inspiring, futuristic, empowering, avant-garde", "kpis": ["Beta signups", "Prompt shares", "Brand awareness"]}', 
    'review', 
    '2026-07-15', 
    '2026-08-31', 
    v_user_id, 
    '["rebrand", "b2b", "saas", "ai-partner"]', 
    '{"impressions": 48200, "conversions": 340, "ctr": 2.15, "roas": 0.00}'
  ) RETURNING id INTO v_campaign_id_2;

  -- 6. Populate Iterations (Prompt Output History)
  INSERT INTO public.iterations (campaign_id, prompt_id, version_label, content, feedback, score, created_by) VALUES
  (
    v_campaign_id_1, 
    v_prompt_id_1, 
    'v1.0-headline-cyber', 
    'Headline: WEAR THE FUTURE. NOW.' || E'\n' || 'Subheadline: Defy the elements with our ultra-breathable, waterproof cybernetic shells designed for modern urban nomads.', 
    '{"comments": ["Excellent subheadline, but the headline might be a bit too aggressive. Let''s try a version focusing on freedom of motion."]}', 
    8.2, 
    v_user_id
  );

  INSERT INTO public.iterations (campaign_id, prompt_id, version_label, content, feedback, score, created_by) VALUES
  (
    v_campaign_id_1, 
    v_prompt_id_1, 
    'v1.1-headline-motion', 
    'Headline: MOTION WITHOUT LIMITS.' || E'\n' || 'Subheadline: Defy the elements with our ultra-breathable, waterproof cybernetic shells designed for modern urban nomads.', 
    '{"comments": ["Perfect! This has the exact combination of technical branding and cyberpunk rebel tone we want. Ready to deploy."]}', 
    9.5, 
    v_user_id
  );

  -- 7. Populate Portfolio Items
  INSERT INTO public.portfolio_items (slug, title, summary, campaign_id, media_urls, results, is_featured) VALUES
  (
    'neo-tokyo-capsule', 
    'Neo-Tokyo Capsule Showcase', 
    'A high-performance interactive visual portfolio showcasing the creative campaign assets, copywriting variations, and stunning neon aesthetics designed for the Gen Z Techwear Launch.', 
    v_campaign_id_1, 
    '["https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800"]', 
    '[{"metric": "ROAS", "value": "4.12x"}, {"metric": "CTR", "value": "3.82%"}, {"metric": "Sales", "value": "$142,000"}]', 
    true
  );

  INSERT INTO public.portfolio_items (slug, title, summary, campaign_id, media_urls, results, is_featured) VALUES
  (
    'creative-ai-identity', 
    'Autonomous Creative Partner Identity', 
    'Complete visual identity redesign, landing page layouts, and prompt engineering playbook crafted to reposition the legacy assistant into a state-of-the-art avant-garde AI partner.', 
    v_campaign_id_2, 
    '["https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?w=800"]', 
    '[{"metric": "Conversion Rate", "value": "4.5%"}, {"metric": "Beta Signups", "value": "3,400+"}]', 
    false
  );

  -- 8. Populate Swipe Vault Collections & Items
  INSERT INTO public.swipe_collections (id, name, owner_id, is_shared) VALUES
  ('55555555-5555-5555-5555-555555555551', 'Cyberpunk & Futuristic Grids', v_user_id, true)
  RETURNING id INTO v_collection_id;

  INSERT INTO public.swipe_items (url, thumbnail_url, title, tags, collection_id, source, saved_by) VALUES
  (
    'https://unsplash.com/photos/cyberpunk-tokyo-alley', 
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600', 
    'Neo-Tokyo Neon Lighting & Color Palettes', 
    '["cyberpunk", "lighting", "branding", "neon"]', 
    v_collection_id, 
    'unsplash.com', 
    v_user_id
  );

  INSERT INTO public.swipe_items (url, thumbnail_url, title, tags, collection_id, source, saved_by) VALUES
  (
    'https://unsplash.com/photos/minimalist-grid-layout', 
    'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600', 
    'Futuristic Minimalist Editorial Layout Inspiration', 
    '["typography", "minimal", "brutalist", "web"]', 
    v_collection_id, 
    'unsplash.com', 
    v_user_id
  );

  -- 9. Populate Workflows
  INSERT INTO public.workflows (title, type, steps, tools_used, author_id, version, is_template) VALUES
  (
    'Futuristic Techwear Campaign Process', 
    'template', 
    '[
      {"order": 1, "title": "Establish Visual Moodboard", "description": "Generate key-visual inspiration in Midjourney v6 using Neo-Tokyo prompts"},
      {"order": 2, "title": "Draft High-Converting Copy", "description": "Feed copywriting target parameters to Claude 3.5 Sonnet to output hero headlines"},
      {"order": 3, "title": "Construct Landing Page Prototype", "description": "Use v0 by Vercel to generate functional responsive layout iterations based on copy"},
      {"order": 4, "title": "Analyze Live Performance", "description": "Review analytics charts in the Reports module to measure CTR and conversion rate"}
    ]', 
    '["claude-3-5-sonnet", "midjourney-v6", "v0-vercel"]', 
    v_user_id, 
    1, 
    true
  );

  RAISE NOTICE '🎉 Success! Database seeded with premium creative sample data.';
END $$;
