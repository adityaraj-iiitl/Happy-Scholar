import React from 'react';
import {Link} from "react-router-dom"
import {useState, useEffect} from "react";
import Navbar from './navbar';

function Login() {
  const [message, setMessage]= useState(""
  );

  useEffect(()=>{
    fetch("http://127.0.0.1:5000/")
         .then(res => res.json())
         .then(data =>{
          console.log(data.message)
          setMessage(data.message);
         })
  },[]);
  
  return (
    <>
     (
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="card shadow p-4" style={{ width: "100%", maxWidth: "400px" }}>
          <h3 className="text-center mb-4">Login</h3>
          <form>
            <div className="mb-3">
              <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
              <input type="email" className="form-control" id="exampleInputEmail1" placeholder="Enter email" />
            </div>

            <div className="mb-3">
              <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
              <input type="password" className="form-control" id="exampleInputPassword1" placeholder="Password" />
            </div>
             
             <div className="mb-2">
                No account , sign up <Link to="/signup">here</Link>
             </div>
            <button type="submit" className="btn btn-primary w-100">Submit</button>
          </form>
        </div>
      </div>
    
  ) 
  </>
  )
}

// Exporting the capitalized component
export default Login;