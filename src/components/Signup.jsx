import React from "react";
import {Link} from "react-router-dom";
function Signup()
{
    return(
      <div className="container d-flex justify-content-center align-items-center min-vh-100">
        <div className="card shadow p-4" style={{ width: "100%", maxWidth: "400px" }}>
          <h3 className="text-center mb-4">Sign Up</h3>
          <form>
            <div className="mb-3">
                <label htmlFor="InputName" className="form-label">Name</label>
                <input type="text" className="form-control" id="InputName" placeholder="Enter Name"/>
            </div>
            <div className="mb-3">
                <label htmlFor="age" className="form-label">Age</label>
                <input type="number" className="form-control" id="age"  />
            </div>
            
            <div className="mb-3">
              <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
              <input type="email" className="form-control" id="exampleInputEmail1" placeholder="Enter email" />
            </div>
            <div className="mb-3">
              <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
              <input type="password" className="form-control" id="exampleInputPassword1" placeholder="Password" />
            </div>
            <div className="mb-3">
                <label htmlFor="pimage" className="form-label">Profile Image</label>
                <input type="file" id="pimage" accept="image/*" className="form-control form-control-sm"/>
            </div>
            <button type="submit" className="btn btn-primary w-100">Submit</button>
          </form>
        </div>
      </div>
    );
}


export default Signup;