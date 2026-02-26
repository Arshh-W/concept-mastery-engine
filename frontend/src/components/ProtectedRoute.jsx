//To secure "Gaming Engine" and ensure progress like XP and BKT data is saved to the correct account...
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const verifyUser = async () => {
            try {
                // Checking if a token exists first to avoid unnecessary API calls
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    setIsAuthenticated(false);
                    return;
                }

                // Verify token with backend
                await getMe(); 
                setIsAuthenticated(true);
            } catch (err) {
                console.error("Auth verification failed:", err);
                localStorage.removeItem('auth_token'); // Clear invalid token
                setIsAuthenticated(false);
            }
        };

        verifyUser();
    }, []);

    // while checking status
    if (isAuthenticated === null) return <div className="loading-screen">Synchronizing...</div>;

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;