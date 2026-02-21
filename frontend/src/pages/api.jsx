import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

//puspose of apiClient is to create a reusable instance of axios with predefined configuration..kaam aasan krne ke liye hai taaki baar baar baseURL aur headers set na krne pade har request ke liye. Isse code cleaner aur maintainable banta hai, aur agar future me koi global configuration change karni ho toh sirf ek jagah change karna padega...hehe

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

export const fetchRoadmap = async () => {
    try {
        const response = await apiClient.get('/roadmap');
        return response.data;
    }
    catch (error)
    {
        console.error('Error fetching roadmap:', error);
        throw error;
    }
};

export const loginUser = async (credentials) => {
    try {
        const response = await apiClient.post('/login', credentials);
        return response.data;
    }
    catch (error) {
        console.error('Error logging in:', error);
        throw error;
    }
};

export const signupUser = async (userData) => {
    try {
        const response = await apiClient.post('/signup', userData);
        return response.data;
    }
    catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
};

export const submitFeedback = async (feedback) => {
    try {
        const response = await apiClient.post('/feedback', feedback);
        return response.data;
    }
    catch (error) {
        console.error('Error submitting feedback:', error);
        throw error;
    }
};

export const submitContact = async (contactData) => {
    try {
        const response = await apiClient.post('/contact', contactData);    
        return response.data;
    }
    catch (error) {
        console.error('Error submitting contact form:', error);
        throw error;
    }   
};

