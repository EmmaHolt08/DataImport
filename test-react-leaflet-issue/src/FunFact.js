import React, { useState, useEffect } from 'react';
import './App.css'; 
import { getFunFact } from './api/fun-fact.js';

//fix how the button looks
// fix the loading time or add a pop up that says loading

export default function FunFact() {
    const [fact, setFact] = useState('Loading a fun fact about landslides...');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchTrigger, setFetchTrigger] = useState(null);

    useEffect(() => {
        const fetchFunFact = async () => {
            setIsLoading(null);
            setError(null);
            try {
                const data = await getFunFact();
                setFact(data.fact);

                } catch (err) {
                console.error("Error fetching fact:", err);
                setError('Failed to retrieve fun fact. Please try again later.');
                setFact('Could not load a fun fact.'); 
            } finally {
                setIsLoading(false); 
            }
        };

        fetchFunFact();
    }, [fetchTrigger]); 

    const handleNewClick = () => {
        setFetchTrigger(prev => prev + 1);
    }

    return(
        <div className="query-form-container"> 
            <h2 className="header"> Fun Facts about Landslides! </h2>
            {isLoading ? (
                <p>Generating fact...</p>
            ) : error ? (
                <p style={{ color: 'red' }}>{error}</p>
            ) : (
                <p> {fact} </p>
            )}
            <button
            onClick={handleNewClick}
            disabled={isLoading}
            className="auth-button auth-button-primary"
            > 
                Load New Fun Fact
            </button>
        </div>
    );
}