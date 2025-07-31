import React, { useState, useEffect } from 'react';
import './App.css'; 
import { getFunFact } from './api/fun-fact.js';


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

                new Promise(resolve => setTimeout(resolve, 1000)) //delay so it dosn't get over stressed
                } catch (err) {
                console.error("Error fetching fact:", err);
                setError('Failed to retrieve fun fact. Please try again later.');
                setFact('Could not load a fun fact.'); 
            } finally {
                setIsLoading(false); 
            }
        };

        fetchFunFact();
    }, [fetchTrigger]); //when the fetchTrigger changes the FunFact function is tiggered


    const handleNewClick = () => {
        setIsLoading(true);
        setFact('Loading new fun fact...');
        setFetchTrigger(prev => prev + 1); //the prev stuff is so it doesn't get stuck
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
            className="auth-button auth-button-secondary"
            > 
                Load New Fun Fact
            </button>
        </div>
    );
}