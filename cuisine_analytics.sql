-- Cuisine Analytics with Comprehensive Country/Cuisine Matching
-- This creates a function to match user tags against known cuisines and countries

-- Create a comprehensive cuisine/country lookup table
CREATE OR REPLACE FUNCTION get_cuisine_mapping()
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
    ('Basque Country', 'Basque', ARRAY['basque country', 'basque']),
    ('Scotland', 'Scottish', ARRAY['scotland', 'scottish'])
  ) AS t(country, cuisine, aliases);
$$;

-- Function to match a tag against cuisines
CREATE OR REPLACE FUNCTION match_cuisine(tag_name text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT cuisine
  FROM get_cuisine_mapping()
  WHERE lower(tag_name) = ANY(aliases)
  LIMIT 1;
$$;

-- Function to get top cuisines for a time range
CREATE OR REPLACE FUNCTION get_top_cuisines(p_start timestamptz, p_end timestamptz, p_limit int default 10)
RETURNS TABLE (cuisine text, freq int) 
LANGUAGE sql 
SECURITY DEFINER 
AS $$
  with f as (
    select di.id as instance_id
    from dinner_instances di
    where di.user_id = auth.uid() 
      and di.datetime >= p_start 
      and di.datetime < p_end
  ),
  matched_tags as (
    select t.name as tag, match_cuisine(t.name) as cuisine
    from tags t
    join f on f.instance_id = t.instance_id
    where t.approved = true
      and match_cuisine(t.name) is not null
    union all
    select t.name as tag, match_cuisine(t.name) as cuisine
    from tags t
    join f on f.instance_id = (
      select di.id from dinner_instances di 
      where di.dish_id = t.dish_id and di.user_id = auth.uid()
      limit 1
    )
    where t.is_base_tag = true 
      and t.approved = true
      and match_cuisine(t.name) is not null
  )
  select cuisine, count(*) as freq
  from matched_tags
  group by cuisine
  order by freq desc
  limit p_limit;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_cuisine_mapping TO authenticated;
GRANT EXECUTE ON FUNCTION match_cuisine TO authenticated;
GRANT EXECUTE ON FUNCTION get_top_cuisines TO authenticated;
