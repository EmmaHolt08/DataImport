import React, { useState, useEffect } from 'react';
import './App.css'; 
//import './api/fun-fact.js';

export default function FunFact() {
    const [fact, setFact] = useState('Loading a fun fact about landslides...');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFunFact = async () => {
            try {
                const data = await fetch('../api/fun-fact');

                console.log(data)
                setFact(data.fact);
            } catch (err) {
                console.error("Error fetching fact:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchFunFact();
    }, []); 

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
        </div>
    );
}