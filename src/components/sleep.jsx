import React from "react";
import {useState , useEffect} from "react"
function Sleep() {
    const [report,setReport]=useState("");
    
    async function analyzeSleep(prompt){
        const API_KEY=import.meta.env.VITE_GEMINI_API_KEY;
        console.log(API_KEY)

       const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

       try{
        const response = await fetch(url, {
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts:[
                            {
                                text:prompt,
                            },
                        ],
                    },
                ],
            }),
        });
      const data = await response.json();

        console.log(response.status);
        console.log(response.ok);
        console.log("Gemini Response:", data);

        if (!response.ok) {
            console.error(data.error);
            return;
        }

        const text =
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "No response received.";

        setReport(text);

        console.log(text);
    }catch(error)
    {
        console.error("Fetch error: ",error);
    }
}
    function handleSubmit(e){
        e.preventDefault();
        console.log("Form submitted");
        const prompt="Hello Gemini";
        analyzeSleep(prompt);
    }
    return (
        <div className="container my-5">
            <div className="card shadow-lg border-0">
                <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">Sleep Assessment Form</h3>
                </div>

                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="form-label fw-bold">Sleep Date</label>
                            <input type="date" className="form-control" />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">How many hours did you sleep?</label>
                            <select className="form-select">
                                <option>Select</option>
                                <option>Less than 4 hours</option>
                                <option>4 - 5 hours</option>
                                <option>5 - 6 hours</option>
                                <option>6 - 7 hours</option>
                                <option>7 - 8 hours</option>
                                <option>8 - 9 hours</option>
                                <option>More than 9 hours</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Approximate Bed Time</label>
                            <input type="time" className="form-control" />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Approximate Wake-up Time</label>
                            <input type="time" className="form-control" />
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">How long did it take you to fall asleep?</label>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="latency" />
                                <label className="form-check-label">Less than 15 minutes</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="latency" />
                                <label className="form-check-label">15 - 30 minutes</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="latency" />
                                <label className="form-check-label">30 - 60 minutes</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="latency" />
                                <label className="form-check-label">More than 1 hour</label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Overall Sleep Quality</label>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="quality" />
                                <label className="form-check-label">😞 Very Poor</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="quality" />
                                <label className="form-check-label">😕 Poor</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="quality" />
                                <label className="form-check-label">😐 Average</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="quality" />
                                <label className="form-check-label">🙂 Good</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="quality" />
                                <label className="form-check-label">😁 Excellent</label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">
                                How many times did you wake up during the night?
                            </label>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="wakeups" />
                                <label className="form-check-label">0</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="wakeups" />
                                <label className="form-check-label">1</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="wakeups" />
                                <label className="form-check-label">2-3</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="wakeups" />
                                <label className="form-check-label">More than 3</label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">How did you feel after waking up?</label>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="morning" />
                                <label className="form-check-label">Very Tired</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="morning" />
                                <label className="form-check-label">Tired</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="morning" />
                                <label className="form-check-label">Neutral</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="morning" />
                                <label className="form-check-label">Refreshed</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="morning" />
                                <label className="form-check-label">Very Refreshed</label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Did you feel sleepy during the day?</label>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="sleepy" />
                                <label className="form-check-label">Never</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="sleepy" />
                                <label className="form-check-label">Sometimes</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="sleepy" />
                                <label className="form-check-label">Often</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="sleepy" />
                                <label className="form-check-label">Always</label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">How much caffeine did you consume today?</label>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="caffeine" />
                                <label className="form-check-label">None</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="caffeine" />
                                <label className="form-check-label">1 cup</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="caffeine" />
                                <label className="form-check-label">2 cups</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="caffeine" />
                                <label className="form-check-label">3 or more cups</label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Stress level before sleeping</label>
                            <select className="form-select">
                                <option>Select</option>
                                <option>Very Low</option>
                                <option>Low</option>
                                <option>Moderate</option>
                                <option>High</option>
                                <option>Very High</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Did you use your phone within 30 minutes before sleeping?</label>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="phone" />
                                <label className="form-check-label">Yes</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="phone" />
                                <label className="form-check-label">No</label>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold">Were you able to perform your daily activities effectively?</label>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="activity" />
                                <label className="form-check-label">Yes</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="activity" />
                                <label className="form-check-label">Partially</label>
                            </div>
                            <div className="form-check">
                                <input className="form-check-input" type="radio" name="activity" />
                                <label className="form-check-label">No</label>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg w-100">
                            Submit Sleep Log
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Sleep;