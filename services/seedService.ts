import { supabase } from '../lib/supabase';

export const seedService = {
    async seedData() {
        console.log('Starting DB Seed...');

        try {
            await this.seedUsersAndProfiles();
            await this.seedJobs();
            await this.seedAssessments();
            await this.seedAssessmentSubmissions();
            console.log('DB Seed Completed Successfully');
        } catch (error) {
            console.error('DB Seed Failed:', error);
        }
    },

    async seedUsersAndProfiles() {
        console.log('Seeding Users & Profiles...');

        // Check if we have candidates
        const { count } = await supabase.from('candidate_profiles').select('*', { count: 'exact', head: true });

        if (count && count > 0) {
            console.log('Candidates already exist, skipping.');
            return;
        }

        const mockCandidates = [
            {
                id: '00000000-0000-0000-0000-000000000001',
                email: 'alex.chen@example.com',
                name: 'Alex Chen',
                role: 'candidate',
                title: 'Senior Frontend Developer',
                location: 'San Francisco, CA',
                bio: 'Passionate React developer with 5+ years of experience building scalable web apps.',
                experience: 'Senior Dev at TechCorp (2020-Present), Frontend Dev at StartUp Inc (2018-2020)',
                years_of_experience: 5,
                preferred_work_mode: 'Remote',
                skills: { 'React': 95, 'TypeScript': 90, 'Node.js': 80 },
                verified: true
            },
            {
                id: '00000000-0000-0000-0000-000000000002',
                email: 'sarah.jones@example.com',
                name: 'Sarah Jones',
                role: 'candidate',
                title: 'Full Stack Engineer',
                location: 'New York, NY',
                bio: 'Full stack wizard who loves solving complex backend problems.',
                experience: 'Software Engineer at FinTech Co (2021-Present)',
                years_of_experience: 3,
                preferred_work_mode: 'Hybrid',
                skills: { 'Python': 95, 'Django': 90, 'React': 75 },
                verified: true
            },
            {
                id: '00000000-0000-0000-0000-000000000003',
                email: 'mike.ross@example.com',
                name: 'Mike Ross',
                role: 'candidate',
                title: 'Product Designer',
                location: 'London, UK',
                bio: 'Designer with a knack for clean UI and intuitive UX.',
                experience: 'Lead Designer at CreativeAgency (2019-Present)',
                years_of_experience: 6,
                preferred_work_mode: 'On-site',
                skills: { 'Figma': 98, 'UI/UX': 95, 'CSS': 85 },
                verified: false
            }
        ];

        for (const candidate of mockCandidates) {
            // 1. Insert into users (public table)
            const { error: userError } = await supabase.from('users').upsert({
                id: candidate.id,
                email: candidate.email,
                name: candidate.name,
                role: candidate.role
            });

            if (userError) console.error('Error seeding user:', candidate.name, userError);

            // 2. Insert into candidate_profiles
            const { error: profileError } = await supabase.from('candidate_profiles').upsert({
                user_id: candidate.id,
                title: candidate.title,
                location: candidate.location,
                bio: candidate.bio,
                experience: candidate.experience,
                years_of_experience: candidate.years_of_experience,
                preferred_work_mode: candidate.preferred_work_mode,
                skills: candidate.skills,
                verified: candidate.verified
            });

            if (profileError) console.error('Error seeding profile:', candidate.name, profileError);
        }
    },

    async seedJobs() {
        console.log('Seeding Jobs...');

        // Check if jobs exist
        const { count } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
        if (count && count > 0) {
            console.log('Jobs already exist, skipping.');
            return;
        }

        const mockJobs = [
            {
                employer_id: '00000000-0000-0000-0000-000000000000', // Placeholder
                title: 'Senior React Developer',
                company: 'TechFlow',
                location: 'Remote',
                type: 'Full-time',
                salary: '$120k - $150k',
                description: 'We are looking for an experienced React developer...',
                required_skills: ['React', 'TypeScript', 'Node.js']
            },
            {
                employer_id: '00000000-0000-0000-0000-000000000000',
                title: 'Product Designer',
                company: 'Designify',
                location: 'New York, NY',
                type: 'Contract',
                salary: '$80k - $100k',
                description: 'Join our award-winning design team...',
                required_skills: ['Figma', 'UI/UX', 'Adobe XD']
            },
            {
                employer_id: '00000000-0000-0000-0000-000000000000',
                title: 'Backend Engineer (Python)',
                company: 'DataCorp',
                location: 'Austin, TX',
                type: 'Full-time',
                salary: '$130k - $160k',
                description: 'Help us build the next generation of data tools...',
                required_skills: ['Python', 'Django', 'PostgreSQL']
            }
        ];

        for (const job of mockJobs) {
            const { error } = await supabase.from('jobs').insert(job);
            if (error) console.error('Error seeding job:', job.title, error);
        }
    },

    async seedAssessments() {
        console.log('Seeding Assessments...');

        const { count } = await supabase.from('assessments').select('*', { count: 'exact', head: true });
        if (count && count > 0) {
            console.log('Assessments already exist, skipping.');
            return;
        }

        const mockAssessments = [
            {
                skill_id: '00000000-0000-0000-0000-000000000001', // Placeholder skill id
                title: 'React Fundamentals',
                difficulty: 'Mid-Level',
                description: 'Test your knowledge of React hooks, lifecycle, and state.',
                starter_code: '// Start coding here',
                theory_questions: [{}, {}]
            },
            {
                skill_id: '00000000-0000-0000-0000-000000000002',
                title: 'Advanced TypeScript',
                difficulty: 'Advanced',
                description: 'Deep dive into generics, utility types, and type guards.',
                starter_code: '// Start coding here',
                theory_questions: [{}, {}, {}]
            },
            {
                skill_id: '00000000-0000-0000-0000-000000000003',
                title: 'Python Data Structures',
                difficulty: 'Beginner',
                description: 'Basic lists, dictionaries, and set operations.',
                starter_code: '# Start coding here',
                theory_questions: [{}, {}]
            }
        ];

        for (const assessment of mockAssessments) {
            const { error } = await supabase.from('assessments').insert(assessment);
            if (error) console.error('Error seeding assessment:', assessment.title, error);
        }
    },

    async seedAssessmentSubmissions() {
        console.log('Seeding Assessment Submissions...');

        const { count } = await supabase.from('assessment_submissions').select('*', { count: 'exact', head: true });
        if (count && count > 0) {
            console.log('Assessment submissions already exist, skipping.');
            return;
        }

        // Get existing assessments to reference
        const { data: assessments } = await supabase.from('assessments').select('id').limit(3);
        if (!assessments || assessments.length === 0) {
            console.log('No assessments found, skipping submissions seed.');
            return;
        }

        // Create submissions for our seeded candidates
        const mockSubmissions = [
            {
                user_id: '00000000-0000-0000-0000-000000000001', // Alex Chen
                assessment_id: assessments[0]?.id,
                code_submission: 'const Component = () => <div>Hello</div>;',
                theory_answers: { q1: 'A', q2: 'B' },
                score: 92,
                feedback: 'Excellent understanding of React fundamentals!',
                passed: true,
                cheating_detected: false
            },
            {
                user_id: '00000000-0000-0000-0000-000000000001', // Alex Chen - second assessment
                assessment_id: assessments[1]?.id,
                code_submission: 'type Wrapper<T> = { value: T };',
                theory_answers: { q1: 'C', q2: 'A', q3: 'B' },
                score: 88,
                feedback: 'Strong TypeScript skills demonstrated.',
                passed: true,
                cheating_detected: false
            },
            {
                user_id: '00000000-0000-0000-0000-000000000002', // Sarah Jones
                assessment_id: assessments[2]?.id,
                code_submission: 'my_list = [1, 2, 3]',
                theory_answers: { q1: 'B', q2: 'A' },
                score: 85,
                feedback: 'Good grasp of Python data structures.',
                passed: true,
                cheating_detected: false
            }
        ];

        for (const submission of mockSubmissions) {
            if (submission.assessment_id) {
                const { error } = await supabase.from('assessment_submissions').insert(submission);
                if (error) console.error('Error seeding submission:', error);
            }
        }

        console.log('Assessment submissions seeded successfully!');
    }
};
