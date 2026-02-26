// Secures routes — checks auth_token and verifies with /auth/me
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import apiClient from '../services/api';

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const verifyUser = async () => {
            try {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    setIsAuthenticated(false);
                    return;
                }
                await apiClient.get('/auth/me');
                setIsAuthenticated(true);
            } catch (err) {
                console.error("Auth verification failed:", err);
                localStorage.removeItem('auth_token');
                setIsAuthenticated(false);
            }
        };
        verifyUser();
    }, []);

    if (isAuthenticated === null) return <div className="loading-screen">Synchronizing...</div>;
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;