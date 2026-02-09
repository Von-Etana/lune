// Run this script to seed test candidates into Supabase
// Usage: cd backend && npx ts-node src/scripts/seedCandidates.ts

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yrnulossvinxpifoukhm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_KEY is required. Set it in backend/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const seedUsers = [
    { id: '11111111-1111-1111-1111-111111111111', email: 'sarah.chen@demo.com', role: 'candidate', name: 'Sarah Chen' },
    { id: '22222222-2222-2222-2222-222222222222', email: 'marcus.johnson@demo.com', role: 'candidate', name: 'Marcus Johnson' },
    { id: '33333333-3333-3333-3333-333333333333', email: 'emily.rodriguez@demo.com', role: 'candidate', name: 'Emily Rodriguez' },
    { id: '44444444-4444-4444-4444-444444444444', email: 'james.williams@demo.com', role: 'candidate', name: 'James Williams' },
    { id: '55555555-5555-5555-5555-555555555555', email: 'priya.patel@demo.com', role: 'candidate', name: 'Priya Patel' },
];

const seedProfiles = [
    {
        user_id: '11111111-1111-1111-1111-111111111111',
        title: 'Senior Virtual Assistant',
        location: 'New York, NY',
        bio: 'Experienced virtual assistant with expertise in executive support, project management, and administrative operations.',
        years_of_experience: 6,
        preferred_work_mode: 'Remote',
        skills: { 'Virtual Assistant': 92, 'Microsoft Excel': 88, 'Google Workspace': 90 },
        certifications: [],
        verified: true
    },
    {
        user_id: '22222222-2222-2222-2222-222222222222',
        title: 'Executive Assistant',
        location: 'Los Angeles, CA',
        bio: 'Detail-oriented executive assistant with a passion for organization and efficiency.',
        years_of_experience: 4,
        preferred_work_mode: 'Hybrid',
        skills: { 'Executive Assistant': 89, 'Report Writing': 82, 'Presentation Skills': 78 },
        certifications: [],
        verified: true
    },
    {
        user_id: '33333333-3333-3333-3333-333333333333',
        title: 'Customer Success Manager',
        location: 'Chicago, IL',
        bio: 'Customer-focused professional dedicated to building lasting client relationships.',
        years_of_experience: 3,
        preferred_work_mode: 'Remote',
        skills: { 'Client Success Manager': 87, 'Customer Support Representative': 91, 'Negotiation': 80 },
        certifications: [],
        verified: true
    },
    {
        user_id: '44444444-4444-4444-4444-444444444444',
        title: 'Data Entry Specialist',
        location: 'Austin, TX',
        bio: 'Fast and accurate data entry specialist with strong attention to detail.',
        years_of_experience: 2,
        preferred_work_mode: 'Remote',
        skills: { 'Data Entry Specialist': 96, 'Microsoft Excel': 92, 'Data Analysis': 78 },
        certifications: [],
        verified: false
    },
    {
        user_id: '55555555-5555-5555-5555-555555555555',
        title: 'Social Media Manager',
        location: 'Miami, FL',
        bio: 'Creative social media strategist with proven track record of growing brand presence.',
        years_of_experience: 4,
        preferred_work_mode: 'Remote',
        skills: { 'Social Media Manager': 94, 'Digital Marketing': 86, 'Content Creator': 90 },
        certifications: [],
        verified: true
    }
];

async function seed() {
    console.log('🌱 Seeding test candidates...\n');

    // Insert users
    console.log('📝 Inserting users...');
    for (const user of seedUsers) {
        const { error } = await supabase.from('users').upsert(user, { onConflict: 'id' });
        if (error) {
            console.error(`   ❌ Failed to insert ${user.name}:`, error.message);
        } else {
            console.log(`   ✅ ${user.name}`);
        }
    }

    // Insert candidate profiles
    console.log('\n📋 Inserting candidate profiles...');
    for (const profile of seedProfiles) {
        const { error } = await supabase.from('candidate_profiles').upsert(profile, { onConflict: 'user_id' });
        if (error) {
            console.error(`   ❌ Failed to insert profile for ${profile.title}:`, error.message);
        } else {
            console.log(`   ✅ ${profile.title}`);
        }
    }

    // Verify
    console.log('\n🔍 Verifying inserted data...');
    const { data: candidates, error: fetchError } = await supabase
        .from('candidate_profiles')
        .select('user_id, title, verified')
        .limit(10);

    if (fetchError) {
        console.error('❌ Error fetching candidates:', fetchError.message);
    } else {
        console.log(`\n✅ Found ${candidates?.length || 0} candidates in database:`);
        candidates?.forEach(c => console.log(`   - ${c.title} (verified: ${c.verified})`));
    }

    console.log('\n🎉 Seeding complete!');
}

seed().catch(console.error);
