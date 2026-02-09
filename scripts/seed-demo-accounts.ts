/**
 * Seed Demo Accounts Script
 * 
 * This script creates demo accounts for testing the Lune platform.
 * Run with: npx ts-node scripts/seed-demo-accounts.ts
 * 
 * Requires environment variables:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DemoAccount {
    email: string;
    password: string;
    name: string;
    role: 'candidate' | 'employer';
    profile: Record<string, any>;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
    // Candidate accounts
    {
        email: 'candidate@demo.lune.com',
        password: 'Demo123!',
        name: 'Jordan Lee',
        role: 'candidate',
        profile: {
            title: 'Full Stack Developer',
            location: 'San Francisco, CA',
            bio: 'Passionate developer with expertise in React and Node.js. Love building scalable web applications.',
            years_of_experience: 3,
            preferred_work_mode: 'Hybrid',
        },
    },
    {
        email: 'developer@demo.lune.com',
        password: 'Demo123!',
        name: 'Alex Chen',
        role: 'candidate',
        profile: {
            title: 'Frontend Engineer',
            location: 'New York, NY',
            bio: 'React specialist with a keen eye for UI/UX. Previously at Meta and Airbnb.',
            years_of_experience: 5,
            preferred_work_mode: 'Remote',
        },
    },
    // Employer accounts
    {
        email: 'employer@demo.lune.com',
        password: 'Demo123!',
        name: 'Sarah Miller',
        role: 'employer',
        profile: {
            company_name: 'TechCorp Inc',
            company_website: 'https://techcorp.demo',
            company_size: '500-1000',
            industry: 'Technology',
        },
    },
    {
        email: 'recruiter@demo.lune.com',
        password: 'Demo123!',
        name: 'Michael Brown',
        role: 'employer',
        profile: {
            company_name: 'StartupXYZ',
            company_website: 'https://startupxyz.demo',
            company_size: '10-50',
            industry: 'SaaS',
        },
    },
];

async function createDemoAccount(account: DemoAccount) {
    console.log(`Creating account for ${account.email}...`);

    try {
        // Check if user already exists
        const { data: existingUsers } = await supabase
            .from('users')
            .select('email')
            .eq('email', account.email);

        if (existingUsers && existingUsers.length > 0) {
            console.log(`  ⏭️  User ${account.email} already exists, skipping...`);
            return;
        }

        // Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: account.email,
            password: account.password,
            email_confirm: true,
        });

        if (authError) {
            throw new Error(`Auth error: ${authError.message}`);
        }

        if (!authData.user) {
            throw new Error('No user returned from auth');
        }

        const userId = authData.user.id;

        // Create user profile
        const { error: userError } = await supabase
            .from('users')
            .insert({
                id: userId,
                email: account.email,
                name: account.name,
                role: account.role,
            });

        if (userError) {
            throw new Error(`User profile error: ${userError.message}`);
        }

        // Create role-specific profile
        if (account.role === 'candidate') {
            const { error: profileError } = await supabase
                .from('candidate_profiles')
                .insert({
                    user_id: userId,
                    ...account.profile,
                });

            if (profileError) {
                throw new Error(`Candidate profile error: ${profileError.message}`);
            }
        } else {
            const { error: profileError } = await supabase
                .from('employer_profiles')
                .insert({
                    user_id: userId,
                    ...account.profile,
                });

            if (profileError) {
                throw new Error(`Employer profile error: ${profileError.message}`);
            }
        }

        console.log(`  ✅ Created ${account.role}: ${account.email}`);
    } catch (error) {
        console.error(`  ❌ Failed to create ${account.email}:`, error);
    }
}

async function main() {
    console.log('\n🌱 Seeding Demo Accounts for Lune Platform\n');
    console.log('='.repeat(50));

    for (const account of DEMO_ACCOUNTS) {
        await createDemoAccount(account);
    }

    console.log('\n' + '='.repeat(50));
    console.log('\n📋 Demo Account Credentials:\n');

    console.log('CANDIDATE ACCOUNTS:');
    DEMO_ACCOUNTS.filter(a => a.role === 'candidate').forEach(a => {
        console.log(`  📧 ${a.email}`);
        console.log(`  🔑 ${a.password}`);
        console.log(`  👤 ${a.name}\n`);
    });

    console.log('EMPLOYER ACCOUNTS:');
    DEMO_ACCOUNTS.filter(a => a.role === 'employer').forEach(a => {
        console.log(`  📧 ${a.email}`);
        console.log(`  🔑 ${a.password}`);
        console.log(`  👤 ${a.name}\n`);
    });

    console.log('✨ Done!\n');
}

main().catch(console.error);
