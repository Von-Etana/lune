import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Create axios instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
                        refresh_token: refreshToken
                    });

                    const { access_token, refresh_token: newRefreshToken } = response.data.session;

                    localStorage.setItem('access_token', access_token);
                    localStorage.setItem('refresh_token', newRefreshToken);

                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                    return apiClient(originalRequest);
                }
            } catch (refreshError) {
                // Refresh failed, clear tokens and redirect to login
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Auth API
export const authAPI = {
    signup: (data: { email: string; password: string; name: string; role: string }) =>
        apiClient.post('/auth/signup', data),

    login: (data: { email: string; password: string }) =>
        apiClient.post('/auth/login', data),

    logout: () =>
        apiClient.post('/auth/logout'),

    getCurrentUser: () =>
        apiClient.get('/auth/me'),

    refreshToken: (refreshToken: string) =>
        apiClient.post('/auth/refresh', { refresh_token: refreshToken })
};

// User API
export const userAPI = {
    getProfile: (userId: string) =>
        apiClient.get(`/users/${userId}`),

    updateProfile: (userId: string, data: any) =>
        apiClient.put(`/users/${userId}`, data),

    uploadVideo: (userId: string, videoUrl: string) =>
        apiClient.post(`/users/${userId}/video`, { videoUrl }),

    getCertifications: (userId: string) =>
        apiClient.get(`/users/${userId}/certifications`)
};

// Assessment API
export const assessmentAPI = {
    generate: (data: { skillName: string; difficulty: string }) =>
        apiClient.post('/assessments/generate', data),

    submit: (data: {
        assessmentId: string;
        codeSubmission: string;
        theoryAnswers: Record<number, number>;
        proctoringMetrics?: any;
    }) =>
        apiClient.post('/assessments/submit', data),

    getAssessment: (assessmentId: string) =>
        apiClient.get(`/assessments/${assessmentId}`),

    getHistory: () =>
        apiClient.get('/assessments/history'),

    submitProctoringEvents: (submissionId: string, events: any[]) =>
        apiClient.post(`/assessments/${submissionId}/proctor`, { events })
};

// Certificate API
export const certificateAPI = {
    mint: (submissionId: string) =>
        apiClient.post('/certificates/mint', { submissionId }),

    verify: (hash: string) =>
        apiClient.get(`/certificates/verify/${hash}`),

    getCertificate: (certificateId: string) =>
        apiClient.get(`/certificates/${certificateId}`),

    getUserCertificates: () =>
        apiClient.get('/certificates')
};

// Job API
export const jobAPI = {
    getJobs: () =>
        apiClient.get('/jobs'),

    createJob: (data: {
        title: string;
        company: string;
        location: string;
        type: string;
        salary: string;
        description: string;
        required_skills?: string[];
    }) =>
        apiClient.post('/jobs', data),

    getMatchedCandidates: (jobId: string) =>
        apiClient.get(`/jobs/${jobId}/candidates`)
};

// Interview API
export const interviewAPI = {
    start: (data: { role: string; topic: 'behavioral' | 'technical' }) =>
        apiClient.post('/interviews/start', data),

    submitAnswer: (data: {
        question: string;
        answer: string;
        role: string;
        topic: string;
    }) =>
        apiClient.post('/interviews/answer', data),

    getFeedback: (interviewId: string) =>
        apiClient.get(`/interviews/${interviewId}/feedback`),

    getHistory: () =>
        apiClient.get('/interviews/history')
};

export default apiClient;
