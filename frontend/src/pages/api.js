import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});



apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const signupUser = async (userData) => {
    try {
       
        const response = await apiClient.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        console.error('Registration failed:', error.response?.data || error.message);
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await apiClient.post('/auth/login', credentials);
        
        
        if (response.data.access_token) {
            localStorage.setItem('access_token', response.data.access_token);
        }
        return response.data;
    } catch (error) {
        console.error('Login failed:', error.response?.data || error.message);
        throw error;
    }
};

export const getMe = async () => {
    try {
        // Fetches the current user profile using the token in the header
        const response = await apiClient.get('/auth/me');
        return response.data;
    } catch (error) {
        console.error('Session expired or invalid:', error.response?.data || error.message);
        throw error;
    }
};

export const logoutUser = () => {
    localStorage.removeItem('access_token');
    window.location.href = '/login'; // Redirect to login
};



export const fetchRoadmap = async () => {
    try {
        const response = await apiClient.get('/roadmap');
        return response.data;
    } catch (error) {
        console.error('Error fetching roadmap:', error);
        throw error;
    }
};

export const submitFeedback = async (feedback) => {
    try {
        const response = await apiClient.post('/feedback', feedback);
        return response.data;
    } catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
    }
};

export const submitContact = async (contactData) => {
    try {
        const response = await apiClient.post('/contact', contactData);    
        return response.data;
    } catch (error) {
        console.error('Error submitting contact form:', error);
        throw error;
    }   
};


export default apiClient;