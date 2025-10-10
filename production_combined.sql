-- ============================================
-- COMPLETE PRODUCTION SQL - DROP-IN READY
-- ============================================
-- This file contains all RPCs and functions needed for Insights and Inspiration features
-- Run this entire file in your Supabase SQL Editor (production environment)

-- ============================================
-- 1. DROP EXISTING FUNCTIONS (avoid conflicts)
-- ============================================
DROP FUNCTION IF EXISTS public.get_dish_of_day(date, integer);
DROP FUNCTION IF EXISTS public.get_kpis(timestamptz, timestamptz);
DROP FUNCTION IF EXISTS public.get_top_tags(timestamptz, timestamptz, integer);
DROP FUNCTION IF EXISTS public.get_trends(timestamptz, timestamptz, text);
DROP FUNCTION IF EXISTS public.get_top_cuisines(timestamptz, timestamptz, integer);
DROP FUNCTION IF EXISTS public.get_cooldown_suggestions(integer, integer, text, integer, text);
DROP FUNCTION IF EXISTS public.get_repeat_cadence(timestamptz, timestamptz, integer);
DROP FUNCTION IF EXISTS public.match_cuisine(text);
DROP FUNCTION IF EXISTS public.get_cuisine_mapping();

-- ============================================
-- 2. CUISINE ANALYTICS FUNCTIONS
-- ============================================

-- Comprehensive cuisine/country lookup
CREATE OR REPLACE FUNCTION public.get_cuisine_mapping()
RETURNS TABLE (country text, cuisine text, aliases text[])
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT * FROM (VALUES
    ('Algeria', 'Algerian', ARRAY['algeria', 'algerian']),
    ('Angola', 'Angolan', ARRAY['angola', 'angolan']),
    ('Benin', 'Beninese', ARRAY['benin', 'beninese']),
    ('Botswana', 'Botswanan', ARRAY['botswana', 'botswanan']),
    ('Burkina Faso', 'Burkinabé', ARRAY['burkina faso', 'burkinabé', 'burkinabe']),
    ('Burundi', 'Burundian', ARRAY['burundi', 'burundian']),
    ('Cameroon', 'Cameroonian', ARRAY['cameroon', 'cameroonian']),
    ('Cape Verde', 'Cape Verdean', ARRAY['cape verde', 'cape verdean']),
    ('Central African Republic', 'Central African', ARRAY['central african republic', 'central african']),
    ('Chad', 'Chadian', ARRAY['chad', 'chadian']),
    ('Comoros', 'Comorian', ARRAY['comoros', 'comorian']),
    ('Democratic Republic of the Congo', 'Congolese', ARRAY['democratic republic of the congo', 'congo', 'congolese']),
    ('Djibouti', 'Djiboutian', ARRAY['djibouti', 'djiboutian']),
    ('Egypt', 'Egyptian', ARRAY['egypt', 'egyptian']),
    ('Equatorial Guinea', 'Equatorial Guinean', ARRAY['equatorial guinea', 'equatorial guinean']),
    ('Eritrea', 'Eritrean', ARRAY['eritrea', 'eritrean']),
    ('Eswatini', 'Eswatini', ARRAY['eswatini', 'swaziland']),
    ('Ethiopia', 'Ethiopian', ARRAY['ethiopia', 'ethiopian']),
    ('Gabon', 'Gabonese', ARRAY['gabon', 'gabonese']),
    ('Gambia', 'Gambian', ARRAY['gambia', 'gambian']),
    ('Ghana', 'Ghanaian', ARRAY['ghana', 'ghanaian']),
    ('Guinea', 'Guinean', ARRAY['guinea', 'guinean']),
    ('Guinea-Bissau', 'Guinean-Bissauan', ARRAY['guinea-bissau', 'guinean-bissauan']),
    ('Ivory Coast', 'Ivorian', ARRAY['ivory coast', 'côte d''ivoire', 'ivorian']),
    ('Kenya', 'Kenyan', ARRAY['kenya', 'kenyan']),
    ('Lesotho', 'Lesotho', ARRAY['lesotho']),
    ('Liberia', 'Liberian', ARRAY['liberia', 'liberian']),
    ('Libya', 'Libyan', ARRAY['libya', 'libyan']),
    ('Madagascar', 'Malagasy', ARRAY['madagascar', 'malagasy']),
    ('Malawi', 'Malawian', ARRAY['malawi', 'malawian']),
    ('Mali', 'Malian', ARRAY['mali', 'malian']),
    ('Mauritania', 'Mauritanian', ARRAY['mauritania', 'mauritanian']),
    ('Mauritius', 'Mauritian', ARRAY['mauritius', 'mauritian']),
    ('Morocco', 'Moroccan', ARRAY['morocco', 'moroccan']),
    ('Mozambique', 'Mozambican', ARRAY['mozambique', 'mozambican']),
    ('Namibia', 'Namibian', ARRAY['namibia', 'namibian']),
    ('Niger', 'Nigerien', ARRAY['niger', 'nigerien']),
    ('Nigeria', 'Nigerian', ARRAY['nigeria', 'nigerian']),
    ('Rwanda', 'Rwandan', ARRAY['rwanda', 'rwandan']),
    ('São Tomé and Príncipe', 'São Toméan', ARRAY['são tomé and príncipe', 'sao tome and principe', 'são toméan', 'sao tomean']),
    ('Senegal', 'Senegalese', ARRAY['senegal', 'senegalese']),
    ('Seychelles', 'Seychellois', ARRAY['seychelles', 'seychellois']),
    ('Sierra Leone', 'Sierra Leonean', ARRAY['sierra leone', 'sierra leonean']),
    ('Somalia', 'Somali', ARRAY['somalia', 'somali']),
    ('South Africa', 'South African', ARRAY['south africa', 'south african']),
    ('South Sudan', 'South Sudanese', ARRAY['south sudan', 'south sudanese']),
    ('Sudan', 'Sudanese', ARRAY['sudan', 'sudanese']),
    ('Tanzania', 'Tanzanian', ARRAY['tanzania', 'tanzanian']),
    ('Togo', 'Togolese', ARRAY['togo', 'togolese']),
    ('Tunisia', 'Tunisian', ARRAY['tunisia', 'tunisian']),
    ('Uganda', 'Ugandan', ARRAY['uganda', 'ugandan']),
    ('Zambia', 'Zambian', ARRAY['zambia', 'zambian']),
    ('Zimbabwe', 'Zimbabwean', ARRAY['zimbabwe', 'zimbabwean']),
    ('Afghanistan', 'Afghan', ARRAY['afghanistan', 'afghan']),
    ('Armenia', 'Armenian', ARRAY['armenia', 'armenian']),
    ('Azerbaijan', 'Azerbaijani', ARRAY['azerbaijan', 'azerbaijani']),
    ('Bahrain', 'Bahraini', ARRAY['bahrain', 'bahraini']),
    ('Bangladesh', 'Bangladeshi', ARRAY['bangladesh', 'bangladeshi']),
    ('Bhutan', 'Bhutanese', ARRAY['bhutan', 'bhutanese']),
    ('Brunei', 'Bruneian', ARRAY['brunei', 'bruneian']),
    ('Myanmar', 'Burmese', ARRAY['myanmar', 'burma', 'burmese']),
    ('Cambodia', 'Cambodian', ARRAY['cambodia', 'cambodian']),
    ('China', 'Chinese', ARRAY['china', 'chinese']),
    ('Cyprus', 'Cypriot', ARRAY['cyprus', 'cypriot']),
    ('Timor-Leste', 'East Timorese', ARRAY['timor-leste', 'east timor', 'east timorese']),
    ('Georgia', 'Georgian', ARRAY['georgia', 'georgian']),
    ('India', 'Indian', ARRAY['india', 'indian']),
    ('Indonesia', 'Indonesian', ARRAY['indonesia', 'indonesian']),
    ('Iran', 'Iranian', ARRAY['iran', 'iranian']),
    ('Iraq', 'Iraqi', ARRAY['iraq', 'iraqi']),
    ('Israel', 'Israeli', ARRAY['israel', 'israeli']),
    ('Japan', 'Japanese', ARRAY['japan', 'japanese']),
    ('Jordan', 'Jordanian', ARRAY['jordan', 'jordanian']),
    ('Kazakhstan', 'Kazakh', ARRAY['kazakhstan', 'kazakh']),
    ('Korea', 'Korean', ARRAY['korea', 'korean', 'south korea', 'north korea']),
    ('Kuwait', 'Kuwaiti', ARRAY['kuwait', 'kuwaiti']),
    ('Kyrgyzstan', 'Kyrgyz', ARRAY['kyrgyzstan', 'kyrgyz']),
    ('Laos', 'Laotian', ARRAY['laos', 'laotian']),
    ('Lebanon', 'Lebanese', ARRAY['lebanon', 'lebanese']),
    ('Malaysia', 'Malaysian', ARRAY['malaysia', 'malaysian']),
    ('Maldives', 'Maldivian', ARRAY['maldives', 'maldivian']),
    ('Mongolia', 'Mongolian', ARRAY['mongolia', 'mongolian']),
    ('Nepal', 'Nepalese', ARRAY['nepal', 'nepalese']),
    ('Oman', 'Omani', ARRAY['oman', 'omani']),
    ('Pakistan', 'Pakistani', ARRAY['pakistan', 'pakistani']),
    ('Palestine', 'Palestinian', ARRAY['palestine', 'palestinian']),
    ('Philippines', 'Filipino', ARRAY['philippines', 'filipino']),
    ('Qatar', 'Qatari', ARRAY['qatar', 'qatari']),
    ('Saudi Arabia', 'Saudi Arabian', ARRAY['saudi arabia', 'saudi arabian']),
    ('Singapore', 'Singaporean', ARRAY['singapore', 'singaporean']),
    ('Sri Lanka', 'Sri Lankan', ARRAY['sri lanka', 'sri lankan']),
    ('Syria', 'Syrian', ARRAY['syria', 'syrian']),
    ('Tajikistan', 'Tajik', ARRAY['tajikistan', 'tajik']),
    ('Thailand', 'Thai', ARRAY['thailand', 'thai']),
    ('Turkey', 'Turkish', ARRAY['turkey', 'turkish']),
    ('Turkmenistan', 'Turkmen', ARRAY['turkmenistan', 'turkmen']),
    ('United Arab Emirates', 'Emirati', ARRAY['united arab emirates', 'uae', 'emirati']),
    ('Uzbekistan', 'Uzbek', ARRAY['uzbekistan', 'uzbek']),
    ('Vietnam', 'Vietnamese', ARRAY['vietnam', 'vietnamese']),
    ('Yemen', 'Yemeni', ARRAY['yemen', 'yemeni']),
    ('Albania', 'Albanian', ARRAY['albania', 'albanian']),
    ('Andorra', 'Andorran', ARRAY['andorra', 'andorran']),
    ('Austria', 'Austrian', ARRAY['austria', 'austrian']),
    ('Belarus', 'Belarusian', ARRAY['belarus', 'belarusian']),
    ('Belgium', 'Belgian', ARRAY['belgium', 'belgian']),
    ('Bosnia and Herzegovina', 'Bosnian', ARRAY['bosnia and herzegovina', 'bosnia', 'bosnian']),
    ('Bulgaria', 'Bulgarian', ARRAY['bulgaria', 'bulgarian']),
    ('Croatia', 'Croatian', ARRAY['croatia', 'croatian']),
    ('Czech Republic', 'Czech', ARRAY['czech republic', 'czech', 'czechia']),
    ('Denmark', 'Danish', ARRAY['denmark', 'danish']),
    ('Netherlands', 'Dutch', ARRAY['netherlands', 'holland', 'dutch']),
    ('England', 'English', ARRAY['england', 'english']),
    ('Estonia', 'Estonian', ARRAY['estonia', 'estonian']),
    ('Finland', 'Finnish', ARRAY['finland', 'finnish']),
    ('France', 'French', ARRAY['france', 'french']),
    ('Germany', 'German', ARRAY['germany', 'german']),
    ('Greece', 'Greek', ARRAY['greece', 'greek']),
    ('Hungary', 'Hungarian', ARRAY['hungary', 'hungarian']),
    ('Iceland', 'Icelandic', ARRAY['iceland', 'icelandic']),
    ('Ireland', 'Irish', ARRAY['ireland', 'irish']),
    ('Italy', 'Italian', ARRAY['italy', 'italian']),
    ('Kosovo', 'Kosovar', ARRAY['kosovo', 'kosovar']),
    ('Latvia', 'Latvian', ARRAY['latvia', 'latvian']),
    ('Lithuania', 'Lithuanian', ARRAY['lithuania', 'lithuanian']),
    ('Luxembourg', 'Luxembourgish', ARRAY['luxembourg', 'luxembourgish']),
    ('North Macedonia', 'Macedonian', ARRAY['north macedonia', 'macedonia', 'macedonian']),
    ('Malta', 'Maltese', ARRAY['malta', 'maltese']),
    ('Moldova', 'Moldovan', ARRAY['moldova', 'moldovan']),
    ('Monaco', 'Monégasque', ARRAY['monaco', 'monégasque', 'monegasque']),
    ('Montenegro', 'Montenegrin', ARRAY['montenegro', 'montenegrin']),
    ('Norway', 'Norwegian', ARRAY['norway', 'norwegian']),
    ('Poland', 'Polish', ARRAY['poland', 'polish']),
    ('Portugal', 'Portuguese', ARRAY['portugal', 'portuguese']),
    ('Romania', 'Romanian', ARRAY['romania', 'romanian']),
    ('Russia', 'Russian', ARRAY['russia', 'russian']),
    ('San Marino', 'San Marinese', ARRAY['san marino', 'san marinese']),
    ('Scotland', 'Scottish', ARRAY['scotland', 'scottish']),
    ('Serbia', 'Serbian', ARRAY['serbia', 'serbian']),
    ('Slovakia', 'Slovak', ARRAY['slovakia', 'slovak']),
    ('Slovenia', 'Slovenian', ARRAY['slovenia', 'slovenian']),
    ('Spain', 'Spanish', ARRAY['spain', 'spanish']),
    ('Sweden', 'Swedish', ARRAY['sweden', 'swedish']),
    ('Switzerland', 'Swiss', ARRAY['switzerland', 'swiss']),
    ('Ukraine', 'Ukrainian', ARRAY['ukraine', 'ukrainian']),
    ('Wales', 'Welsh', ARRAY['wales', 'welsh']),
    ('Antigua and Barbuda', 'Antiguan and Barbudan', ARRAY['antigua and barbuda', 'antiguan and barbudan']),
    ('Argentina', 'Argentine', ARRAY['argentina', 'argentine', 'argentinian']),
    ('Bahamas', 'Bahamian', ARRAY['bahamas', 'bahamian']),
    ('Barbados', 'Barbadian', ARRAY['barbados', 'barbadian']),
    ('Belize', 'Belizean', ARRAY['belize', 'belizean']),
    ('Bolivia', 'Bolivian', ARRAY['bolivia', 'bolivian']),
    ('Brazil', 'Brazilian', ARRAY['brazil', 'brazilian']),
    ('Canada', 'Canadian', ARRAY['canada', 'canadian']),
    ('Chile', 'Chilean', ARRAY['chile', 'chilean']),
    ('Colombia', 'Colombian', ARRAY['colombia', 'colombian']),
    ('Costa Rica', 'Costa Rican', ARRAY['costa rica', 'costa rican']),
    ('Cuba', 'Cuban', ARRAY['cuba', 'cuban']),
    ('Dominican Republic', 'Dominican', ARRAY['dominican republic', 'dominican']),
    ('Ecuador', 'Ecuadorian', ARRAY['ecuador', 'ecuadorian']),
    ('El Salvador', 'Salvadoran', ARRAY['el salvador', 'salvadoran']),
    ('Grenada', 'Grenadian', ARRAY['grenada', 'grenadian']),
    ('Guatemala', 'Guatemalan', ARRAY['guatemala', 'guatemalan']),
    ('Guyana', 'Guyanese', ARRAY['guyana', 'guyanese']),
    ('Haiti', 'Haitian', ARRAY['haiti', 'haitian']),
    ('Honduras', 'Honduran', ARRAY['honduras', 'honduran']),
    ('Jamaica', 'Jamaican', ARRAY['jamaica', 'jamaican']),
    ('Mexico', 'Mexican', ARRAY['mexico', 'mexican']),
    ('Nicaragua', 'Nicaraguan', ARRAY['nicaragua', 'nicaraguan']),
    ('Panama', 'Panamanian', ARRAY['panama', 'panamanian']),
    ('Paraguay', 'Paraguayan', ARRAY['paraguay', 'paraguayan']),
    ('Peru', 'Peruvian', ARRAY['peru', 'peruvian']),
    ('Puerto Rico', 'Puerto Rican', ARRAY['puerto rico', 'puerto rican']),
    ('Saint Kitts and Nevis', 'Saint Kitts and Nevis', ARRAY['saint kitts and nevis']),
    ('Saint Lucia', 'Saint Lucian', ARRAY['saint lucia', 'saint lucian']),
    ('Saint Vincent and the Grenadines', 'Saint Vincentian', ARRAY['saint vincent and the grenadines', 'saint vincentian']),
    ('Suriname', 'Surinamese', ARRAY['suriname', 'surinamese']),
    ('Trinidad and Tobago', 'Trinidadian and Tobagonian', ARRAY['trinidad and tobago', 'trinidadian and tobagonian']),
    ('Uruguay', 'Uruguayan', ARRAY['uruguay', 'uruguayan']),
    ('Venezuela', 'Venezuelan', ARRAY['venezuela', 'venezuelan']),
    ('United States', 'American', ARRAY['united states', 'usa', 'us', 'america', 'american']),
    ('Australia', 'Australian', ARRAY['australia', 'australian']),
    ('Fiji', 'Fijian', ARRAY['fiji', 'fijian']),
    ('Kiribati', 'Kiribati', ARRAY['kiribati']),
    ('Marshall Islands', 'Marshallese', ARRAY['marshall islands', 'marshallese']),
    ('Micronesia', 'Micronesian', ARRAY['micronesia', 'micronesian']),
    ('Nauru', 'Nauruan', ARRAY['nauru', 'nauruan']),
    ('New Zealand', 'New Zealander', ARRAY['new zealand', 'new zealander']),
    ('Palau', 'Palauan', ARRAY['palau', 'palauan']),
    ('Papua New Guinea', 'Papuan', ARRAY['papua new guinea', 'papuan']),
    ('Samoa', 'Samoan', ARRAY['samoa', 'samoan']),
    ('Solomon Islands', 'Solomon Islander', ARRAY['solomon islands', 'solomon islander']),
    ('Tonga', 'Tongan', ARRAY['tonga', 'tongan']),
    ('Tuvalu', 'Tuvaluan', ARRAY['tuvalu', 'tuvaluan']),
    ('Vanuatu', 'Vanuatuan', ARRAY['vanuatu', 'vanuatuan']),
    ('Hong Kong', 'Hong Kong', ARRAY['hong kong']),
    ('Macau', 'Macau', ARRAY['macau', 'macao']),
    ('Taiwan', 'Taiwanese', ARRAY['taiwan', 'taiwanese']),
    ('Kurdistan', 'Kurdish', ARRAY['kurdistan', 'kurdish']),
    ('Basque Country', 'Basque', ARRAY['basque country', 'basque'])
  ) AS t(country, cuisine, aliases);
$$;

-- Match a tag against cuisines
CREATE OR REPLACE FUNCTION public.match_cuisine(tag_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT cuisine
  FROM get_cuisine_mapping()
  WHERE lower(tag_name) = ANY(aliases)
  LIMIT 1;
$$;

-- Get top cuisines for a time range (counts consumption records)
CREATE OR REPLACE FUNCTION public.get_top_cuisines(
  p_start timestamptz,
  p_end timestamptz,
  p_limit int default 10
)
RETURNS TABLE (cuisine text, freq int)
LANGUAGE sql
SECURITY DEFINER
AS $$
  with records as (
    select
      cr.id as record_id,
      cr.instance_id,
      cr.consumed_at,
      di.dish_id
    from consumption_records cr
    join dinner_instances di on di.id = cr.instance_id
    where cr.user_id = auth.uid()
      and cr.consumed_at >= p_start
      and cr.consumed_at < p_end
  ),
  instance_cuisines as (
    select
      t.instance_id,
      min(match_cuisine(t.name)) as cuisine
    from tags t
    where t.approved = true
      and match_cuisine(t.name) is not null
    group by t.instance_id
  ),
  dish_cuisines as (
    select
      t.dish_id,
      min(match_cuisine(t.name)) as cuisine
    from tags t
    where t.is_base_tag = true
      and t.approved = true
      and match_cuisine(t.name) is not null
    group by t.dish_id
  ),
  record_cuisine as (
    select
      r.record_id,
      coalesce(ic.cuisine, dc.cuisine) as cuisine
    from records r
    left join instance_cuisines ic on ic.instance_id = r.instance_id
    left join dish_cuisines dc on dc.dish_id = r.dish_id
  )
  select cuisine, count(*)::int as freq
  from record_cuisine
  where cuisine is not null
  group by cuisine
  order by freq desc
  limit p_limit;
$$;

-- ============================================
-- 3. INSIGHTS RPCs
-- ============================================

-- Get KPIs for a time range (counts consumption records)
CREATE OR REPLACE FUNCTION public.get_kpis(p_start timestamptz, p_end timestamptz)
RETURNS TABLE (
  total_meals int,
  unique_dishes int,
  unique_variants int,
  new_ratio numeric,
  avg_health numeric,
  avg_effort text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  with records as (
    select cr.id, cr.instance_id, di.dish_id, d.health_score, d.effort
    from consumption_records cr
    join dinner_instances di on di.id = cr.instance_id
    join dishes d on d.id = di.dish_id
    where cr.user_id = auth.uid()
      and cr.consumed_at >= p_start
      and cr.consumed_at < p_end
  ),
  counts as (
    select
      count(*) as total_meals,
      count(distinct dish_id) as unique_dishes,
      count(distinct instance_id) as unique_variants
    from records
  ),
  flags as (
    select
      avg((case when cnt = 1 then 1 else 0 end)::numeric) as new_ratio
    from (
      select dish_id, count(*) as cnt from records group by dish_id
    ) s
  ),
  metrics as (
    select
      avg(health_score)::numeric as avg_health,
      mode() within group (order by effort) as avg_effort
    from records
  )
  select counts.total_meals, counts.unique_dishes, counts.unique_variants,
         coalesce(flags.new_ratio, 0), metrics.avg_health, metrics.avg_effort
  from counts, flags, metrics;
$$;

-- Get top tags/ingredients for a time range (excludes cuisine tags, counts consumption records)
CREATE OR REPLACE FUNCTION public.get_top_tags(p_start timestamptz, p_end timestamptz, p_limit int default 20)
RETURNS TABLE (tag text, freq int)
LANGUAGE sql
SECURITY DEFINER
AS $$
  with records as (
    select cr.id as record_id, cr.instance_id, di.dish_id
    from consumption_records cr
    join dinner_instances di on di.id = cr.instance_id
    where cr.user_id = auth.uid()
      and cr.consumed_at >= p_start
      and cr.consumed_at < p_end
  ),
  instance_tags as (
    select r.record_id, t.name as tag
    from records r
    join tags t on t.instance_id = r.instance_id
    where t.approved = true
      and t.type != 'cuisine'
      and match_cuisine(t.name) is null
  ),
  dish_tags as (
    select r.record_id, t.name as tag
    from records r
    join tags t on t.dish_id = r.dish_id
    where t.is_base_tag = true
      and t.approved = true
      and t.type != 'cuisine'
      and match_cuisine(t.name) is null
  ),
  all_tags as (
    select tag from instance_tags
    union all
    select tag from dish_tags
  )
  select tag, count(*)::int as freq
  from all_tags
  group by tag
  order by freq desc
  limit p_limit;
$$;

-- Get health/effort trends over time
CREATE OR REPLACE FUNCTION public.get_trends(p_start timestamptz, p_end timestamptz, p_bucket text default 'day')
RETURNS TABLE (bucket_date date, avg_health numeric, effort_mode text, meals int)
LANGUAGE sql
SECURITY DEFINER
AS $$
  with f as (
    select di.datetime, d.health_score, d.effort
    from dinner_instances di
    join dishes d on d.id = di.dish_id
    where di.user_id = auth.uid()
      and di.datetime >= p_start
      and di.datetime < p_end
  )
  select date_trunc(p_bucket, datetime)::date as bucket_date,
         avg(health_score)::numeric as avg_health,
         mode() within group (order by effort) as effort_mode,
         count(*) as meals
  from f
  group by 1
  order by 1;
$$;

-- Get repeat cadence analysis
CREATE OR REPLACE FUNCTION public.get_repeat_cadence(p_start timestamptz, p_end timestamptz, p_limit int default 20)
RETURNS TABLE (dish_id uuid, dish_title text, median_gap_days numeric, last_eaten timestamptz, due boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
begin
  return query
  with f as (
    select di.dish_id, d.title as dish_title, di.datetime
    from dinner_instances di
    join dishes d on d.id = di.dish_id
    where di.user_id = auth.uid() and di.datetime >= p_start and di.datetime < p_end
    order by di.dish_id, di.datetime
  ),
  gaps as (
    select dish_id, dish_title,
           datetime - lag(datetime) over (partition by dish_id order by datetime) as gap,
           datetime as last_eaten
    from f
  ),
  agg as (
    select dish_id, max(dish_title) dish_title,
           percentile_cont(0.5) within group (order by extract(epoch from gap)/86400) as median_gap_days,
           max(last_eaten) as last_eaten
    from gaps
    where gap is not null
    group by dish_id
  )
  select dish_id, dish_title, median_gap_days, last_eaten,
         (now() - last_eaten) > (median_gap_days * interval '1 day') as due
  from agg
  order by due desc, last_eaten asc
  limit p_limit;
end;
$$;

-- ============================================
-- 4. INSPIRATION RPCs
-- ============================================

-- Get cooldown suggestions (dishes not eaten recently)
CREATE OR REPLACE FUNCTION public.get_cooldown_suggestions(
  p_cooldown_days int default 14,
  p_limit int default 20,
  p_meal_type text default null,
  p_min_health int default null,
  p_max_effort text default null
)
RETURNS TABLE (dish_id uuid, dish_title text, last_eaten timestamptz, times_90d int)
LANGUAGE sql
SECURITY DEFINER
AS $$
  with last as (
    select dish_id, max(datetime) last_eaten
    from dinner_instances
    where user_id = auth.uid()
    group by dish_id
  ),
  recent as (
    select d.*
    from dishes d
    where d.user_id = auth.uid()
      and (p_meal_type is null or d.meal_type = p_meal_type)
      and (p_min_health is null or d.health_score >= p_min_health)
      and (p_max_effort is null or d.effort <= p_max_effort)
  ),
  counts as (
    select dish_id, count(*) filter (where datetime >= now() - interval '90 days') as times_90d
    from dinner_instances di
    where di.user_id = auth.uid()
    group by dish_id
  )
  select l.dish_id, r.title as dish_title, l.last_eaten, coalesce(c.times_90d,0) as times_90d
  from last l
  join recent r on r.id = l.dish_id
  left join counts c on c.dish_id = l.dish_id
  where coalesce(l.last_eaten, timestamp 'epoch') <= now() - (p_cooldown_days || ' days')::interval
  order by l.last_eaten nulls first, c.times_90d asc
  limit p_limit;
$$;

-- Get dish of the day (deterministic scoring with photo_url)
CREATE OR REPLACE FUNCTION public.get_dish_of_day(
  p_date date default current_date,
  p_top_k int default 5
)
RETURNS TABLE (dish_id uuid, dish_title text, top_variant text, last_eaten timestamptz, score numeric, photo_url text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  with at_home_variants as (
    select di.id as instance_id, di.dish_id, d.title as dish_title
    from dinner_instances di
    join dishes d on d.id = di.dish_id
    where d.user_id = auth.uid()
      and exists (
        select 1 from consumption_records cr
        where cr.instance_id = di.id
          and cr.user_id = auth.uid()
          and (cr.location is null or btrim(cr.location) = '' or lower(cr.location) like '%home%')
      )
  ),
  any_variants as (
    select di.id as instance_id, di.dish_id, d.title as dish_title
    from dinner_instances di
    join dishes d on d.id = di.dish_id
    where d.user_id = auth.uid()
  ),
  base_pool as (
    select * from at_home_variants
    union all
    select * from any_variants
    where not exists (select 1 from at_home_variants)
  ),
  recent_stats as (
    select di.dish_id,
           max(cr.consumed_at) as last_eaten,
           count(*) filter (where cr.consumed_at >= now() - interval '90 days') as times_90d
    from consumption_records cr
    join dinner_instances di on di.id = cr.instance_id
    where cr.user_id = auth.uid()
    group by di.dish_id
  ),
  has_home_flag as (
    select
      bp.dish_id,
      bool_or(
        cr.location is null
        or btrim(cr.location) = ''
        or lower(cr.location) like '%home%'
      ) as has_home
    from base_pool bp
    join dinner_instances di on di.dish_id = bp.dish_id
    join consumption_records cr on cr.instance_id = di.id and cr.user_id = auth.uid()
    group by bp.dish_id
  ),
  candidates as (
    select
      bp.dish_id,
      bp.dish_title,
      rs.last_eaten,
      coalesce(rs.times_90d, 0) as times_90d,
      case
        when rs.last_eaten is null then 0.7
        else least(1.0, greatest(0.0, extract(epoch from (now() - rs.last_eaten)) / (45 * 86400)))
      end as recency_score,
      1.0 / (1.0 + coalesce(rs.times_90d, 0)) as diversity_score,
      case
        when exists (
          select 1
          from consumption_records cr2
          join dinner_instances di2 on di2.id = cr2.instance_id
          where di2.dish_id = bp.dish_id
            and cr2.user_id = auth.uid()
            and extract(dow from cr2.consumed_at) = extract(dow from p_date::timestamp)
        ) then 0.8 else 0.5 end as weekday_affinity,
      coalesce(hh.has_home, false) as has_home
    from base_pool bp
    left join recent_stats rs on rs.dish_id = bp.dish_id
    left join has_home_flag hh on hh.dish_id = bp.dish_id
  ),
  scored as (
    select
      c.dish_id,
      c.dish_title,
      c.last_eaten,
      (0.45 * c.recency_score + 0.35 * c.diversity_score + 0.20 * c.weekday_affinity)
      * case when c.has_home then 1.0 else 0.6 end as final_score
    from candidates c
  ),
  ranked as (
    select
      s.*,
      row_number() over (order by s.final_score desc, coalesce(s.last_eaten, 'epoch') asc) as rn
    from scored s
  ),
  top_k as (
    select * from ranked where rn <= p_top_k
  ),
  selected as (
    select *,
           abs(hashtext(auth.uid()::text || p_date::text || dish_id::text)) % greatest(p_top_k, 1) as hash_rank
    from top_k
  ),
  winner as (
    select dish_id, dish_title, last_eaten, final_score
    from selected
    where hash_rank = (select min(hash_rank) from selected)
    limit 1
  )
  select
    w.dish_id,
    w.dish_title,
    (
      select di.variant_title
      from dinner_instances di
      left join consumption_records cr on cr.instance_id = di.id and cr.user_id = auth.uid()
      where di.dish_id = w.dish_id and di.user_id = auth.uid()
      order by coalesce(cr.consumed_at, di.datetime) desc nulls last
      limit 1
    ) as top_variant,
    w.last_eaten,
    w.final_score as score,
    coalesce(
      (
        select di.photo_url
        from dinner_instances di
        left join consumption_records cr on cr.instance_id = di.id and cr.user_id = auth.uid()
        where di.dish_id = w.dish_id and di.user_id = auth.uid()
        order by coalesce(cr.consumed_at, di.datetime) desc nulls last
        limit 1
      ),
      (select d.base_photo_url from dishes d where d.id = w.dish_id)
    ) as photo_url
  from winner w;
$$;

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_cuisine_mapping() TO authenticated;
GRANT EXECUTE ON FUNCTION public.match_cuisine(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_cuisines(timestamptz, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_kpis(timestamptz, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_tags(timestamptz, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_trends(timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_repeat_cadence(timestamptz, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_cooldown_suggestions(integer, integer, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dish_of_day(date, integer) TO authenticated;

-- ============================================
-- DONE! All functions are now ready.
-- ============================================

